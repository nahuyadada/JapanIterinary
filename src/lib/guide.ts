import type { Place } from "@/data/places";
import type { Day } from "@/lib/itinerary";
import { haversineKm, type StayRecommendation } from "@/lib/lodging";
import {
  directionsUrl,
  hasCoords,
  type NavOrigin,
  type NavPoint,
  type TransportMode,
} from "@/lib/navigation";
import { normalizeShareCode } from "@/lib/shareCode";

const MS_PER_DAY = 86_400_000;

/** The stay a day belongs to, as keyed in `TripPayload.stayOrigins`. */
export function stayKey(region: string, firstDayIndex: number): string {
  return `${region}-${firstDayIndex}`;
}

/**
 * One move in the day: leave `from`, go to `to`, and see `place` when you arrive.
 *
 * `directionsUrl` hands the routing to Google Maps. We deliberately do not attach a
 * duration or an arrival time — see navigation.ts. Travel time depends on the actual
 * departure moment and live service, so any number invented here would be wrong in a
 * way the traveler couldn't detect.
 */
export type GuideLeg = {
  /** Position within the day, 0-based. */
  index: number;
  from: NavOrigin;
  to: NavPoint;
  place: Place;
  /** Crow-flies km, or null when the origin is a typed hotel we have no coordinates for. */
  straightLineKm: number | null;
  directionsUrl: string;
};

export type GuideDay = {
  dayIndex: number;
  date: Date;
  /** Where the day starts: the stay's lodging, or the first attraction. */
  origin: NavOrigin | null;
  legs: GuideLeg[];
};

/**
 * Turn a typed hotel name into something Google Maps can find. A bare name like
 * "Sakura Inn" geocodes almost anywhere, so we append the city the stay is in —
 * unless the traveler already typed it.
 */
export function textOrigin(typed: string, cityHint?: string): NavOrigin {
  const name = typed.trim();
  const hint = cityHint?.trim();
  const needsHint = hint && !name.toLowerCase().includes(hint.toLowerCase());
  return { name, query: needsHint ? `${name}, ${hint}` : name };
}

/**
 * The city out of a `Place.city`, which is either "City" or "District, City". The city is
 * the right anchor for a typed hotel: the district belongs to the attraction, and the
 * hotel is very often in a different one.
 */
function cityProper(city: string | undefined): string | undefined {
  const last = city?.split(",").pop()?.trim();
  return last || undefined;
}

/**
 * Decide where each day starts. A hotel the traveler typed for that stay wins, because
 * it's where they actually are; otherwise the day starts from the stay's top
 * recommended lodging area. Days belonging to no stay get no origin.
 */
export function guideOrigins(
  recommendations: StayRecommendation[],
  stayOrigins: Record<string, string> = {}
): Map<number, NavOrigin> {
  const byDay = new Map<number, NavOrigin>();
  for (const rec of recommendations) {
    const firstDay = rec.stay.dayIndexes[0];
    if (firstDay === undefined) continue;

    const typed = stayOrigins[stayKey(rec.stay.region, firstDay)]?.trim();
    let origin: NavOrigin | null = null;
    if (typed) {
      origin = textOrigin(typed, cityProper(rec.stay.places[0]?.city));
    } else {
      const top = rec.areas[0];
      if (top) origin = { name: top.name, lat: top.lat, lng: top.lng };
    }
    if (!origin) continue;

    for (const dayIndex of rec.stay.dayIndexes) byDay.set(dayIndex, origin);
  }
  return byDay;
}

/**
 * Build the day-by-day walkthrough. Each day chains from its origin through the day's
 * attractions in itinerary order, one leg per arrival.
 *
 * When a day has no origin the first attraction becomes the starting point and gets no
 * leg of its own — the same rule buildDayRoutes and buildDaySchedule use, so the three
 * views of a trip stay consistent. Attractions without coordinates are skipped, since
 * there is nothing to navigate to.
 */
export function buildGuideDays(
  days: Day[],
  origins: Map<number, NavOrigin>,
  mode: TransportMode
): GuideDay[] {
  return days.map((day) => {
    const points: NavPoint[] = [];
    const places: Place[] = [];
    for (const p of day.places) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      points.push({ name: p.name, lat: p.lat, lng: p.lng });
      places.push(p);
    }

    const origin = origins.get(day.dayIndex) ?? null;
    let from: NavOrigin | null = origin;
    let startIndex = 0;
    if (!from) {
      from = points[0] ?? null;
      startIndex = 1;
    }

    const legs: GuideLeg[] = [];
    for (let i = startIndex; i < points.length && from; i++) {
      const to = points[i];
      legs.push({
        index: legs.length,
        from,
        to,
        place: places[i],
        straightLineKm: hasCoords(from) ? haversineKm(from.lat, from.lng, to.lat, to.lng) : null,
        directionsUrl: directionsUrl(from, to, mode),
      });
      from = to;
    }

    return { dayIndex: day.dayIndex, date: day.date, origin, legs };
  });
}

/** Where the trip sits relative to now. */
export type TripPhase = "before" | "during" | "after";

export type TripPosition = {
  phase: TripPhase;
  /** The day the calendar puts the traveler on, clamped to a real day. */
  dayIndex: number;
  /** Whole days until day 1; 0 once the trip has started. */
  daysUntilStart: number;
};

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Which day of the trip it is, from an injected clock. Compared at local midnight so a
 * traveler looking at their phone at 23:50 is still on today's day, not tomorrow's.
 *
 * An empty trip reports "before" with no days to wait for — the caller has nothing to
 * show either way.
 */
export function tripPosition(days: { date: Date }[], now: Date): TripPosition {
  if (days.length === 0) return { phase: "before", dayIndex: 0, daysUntilStart: 0 };

  const today = atMidnight(now).getTime();
  const first = atMidnight(days[0].date).getTime();
  const offset = Math.round((today - first) / MS_PER_DAY);

  if (offset < 0) return { phase: "before", dayIndex: 0, daysUntilStart: -offset };
  if (offset >= days.length) {
    return { phase: "after", dayIndex: days.length - 1, daysUntilStart: 0 };
  }
  return { phase: "during", dayIndex: offset, daysUntilStart: 0 };
}

/**
 * How far the traveler has got. Lives in localStorage, never in the database: it belongs
 * to the person walking the trip, not to the shared plan, and two people following the
 * same link tick things off independently.
 */
export type GuideProgress = {
  /** Set once the traveler presses Start Trip, so a reload doesn't send them back. */
  started: boolean;
  /** dayIndex -> legs ticked off. */
  done: Record<number, number>;
};

export const EMPTY_PROGRESS: GuideProgress = { started: false, done: {} };

/** Begin the walkthrough. Idempotent. */
export function startTrip(progress: GuideProgress): GuideProgress {
  return { ...progress, started: true };
}

/** Legs completed on a day, never negative. */
export function legsDone(progress: GuideProgress, dayIndex: number): number {
  return Math.max(0, progress.done[dayIndex] ?? 0);
}

/** A day is done when nothing is left — including a day that had nothing to begin with. */
export function isDayDone(day: GuideDay, progress: GuideProgress): boolean {
  return legsDone(progress, day.dayIndex) >= day.legs.length;
}

/** The leg the traveler is on, or null once the day is finished. */
export function currentLeg(day: GuideDay, progress: GuideProgress): GuideLeg | null {
  return day.legs[legsDone(progress, day.dayIndex)] ?? null;
}

/**
 * Tick off the current leg. Advance-on-complete: the count moves forward one, capped at
 * the day's leg count so repeated taps can't push progress past the end of the day.
 */
export function completeLeg(progress: GuideProgress, day: GuideDay): GuideProgress {
  const next = Math.min(day.legs.length, legsDone(progress, day.dayIndex) + 1);
  return { ...progress, done: { ...progress.done, [day.dayIndex]: next } };
}

/** Undo the last tick on a day, for a mis-tap. */
export function undoLeg(progress: GuideProgress, dayIndex: number): GuideProgress {
  const next = Math.max(0, legsDone(progress, dayIndex) - 1);
  return { ...progress, done: { ...progress.done, [dayIndex]: next } };
}

/** Clear a day's progress. */
export function resetDay(progress: GuideProgress, dayIndex: number): GuideProgress {
  return { ...progress, done: { ...progress.done, [dayIndex]: 0 } };
}

/**
 * The day the guide should show. Normally the calendar's day, but once the traveler has
 * ticked off everything on it the guide moves to the next day with work left, so a
 * finished day isn't a dead end. When everything from here on is done, it stays on the
 * last day rather than pointing past the trip.
 */
export function activeDayIndex(
  guideDays: GuideDay[],
  progress: GuideProgress,
  now: Date
): number {
  if (guideDays.length === 0) return 0;
  const { dayIndex } = tripPosition(guideDays, now);

  for (let i = dayIndex; i < guideDays.length; i++) {
    if (!isDayDone(guideDays[i], progress)) return i;
  }
  return guideDays.length - 1;
}

/** Legs done across the whole trip, and how many there are. */
export function tripProgress(
  guideDays: GuideDay[],
  progress: GuideProgress
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const day of guideDays) {
    total += day.legs.length;
    done += Math.min(day.legs.length, legsDone(progress, day.dayIndex));
  }
  return { done, total };
}

export const GUIDE_STORAGE_PREFIX = "japan-guide-v1:";

/** localStorage key for a trip's progress. Keyed by share code, so two trips don't mix. */
export function guideStorageKey(code: string): string {
  return `${GUIDE_STORAGE_PREFIX}${normalizeShareCode(code)}`;
}

/**
 * Read progress out of localStorage. This is a trust boundary too — the value is
 * whatever is sitting in the browser, possibly written by an older version of this
 * code — so anything that isn't a whole non-negative count under a numeric day key is
 * dropped.
 */
export function parseProgress(raw: string | null): GuideProgress {
  if (!raw) return EMPTY_PROGRESS;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_PROGRESS;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return EMPTY_PROGRESS;
  }
  // An older stored value has no `started` flag; treating that as "not started" just
  // shows the traveler the overview again, which is harmless.
  const started = (parsed as { started?: unknown }).started === true;
  const done = (parsed as { done?: unknown }).done;
  if (typeof done !== "object" || done === null || Array.isArray(done)) {
    return { started, done: {} };
  }

  const out: Record<number, number> = {};
  for (const [key, value] of Object.entries(done)) {
    const dayIndex = Number(key);
    if (!Number.isInteger(dayIndex) || dayIndex < 0) continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) continue;
    out[dayIndex] = Math.floor(value);
  }
  return { started, done: out };
}

export function serializeProgress(progress: GuideProgress): string {
  return JSON.stringify({ started: progress.started, done: progress.done });
}
