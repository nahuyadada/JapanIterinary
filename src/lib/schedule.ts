import type { Place } from "@/data/places";
import type { Day } from "@/lib/itinerary";
import { haversineKm } from "@/lib/lodging";
import { directionsUrl, type NavPoint, type TransportMode } from "@/lib/navigation";
import { durationRangeFor } from "@/lib/duration";

export type ScheduleOptions = {
  /** Minutes past midnight the traveler wakes up. Default 07:30. */
  wakeMinutes?: number;
  /** Minutes for breakfast + getting ready before leaving. Default 90. */
  morningBufferMin?: number;
  /** placeId -> "HH:MM" entry time printed on a ticket the traveler already holds. */
  fixedTimes?: Record<string, string>;
};

export type ScheduleEntry =
  | { kind: "wake"; time: number; label: string }
  | {
      kind: "travel";
      time: number;
      minutes: number;
      from: string;
      to: string;
      mode: TransportMode;
      km: number;
      url: string;
    }
  | {
      kind: "visit";
      time: number;
      endTime: number;
      place: Place;
      /** Minutes after the ticket's entry time that the traveler is estimated to arrive. */
      late?: number;
    };

// Rough effective speeds (km/h) and fixed overhead (min) per mode. These produce an
// ESTIMATE only — real routing and departure times come from the Google Maps links.
//
// Speed rises with distance: the first stretch is city pace (subway and walking, or city
// streets), the next is a regional express or expressway, and the rest is shinkansen. One
// flat city speed made a day trip like Tokyo to Nikko come out at over eight hours.
const TRAVEL: Record<TransportMode, { overhead: number; tiers: { upToKm: number; speed: number }[] }> = {
  walking: { overhead: 0, tiers: [{ upToKm: Infinity, speed: 4.8 }] },
  transit: {
    overhead: 8,
    tiers: [
      { upToKm: 10, speed: 18 },
      { upToKm: 150, speed: 70 },
      { upToKm: Infinity, speed: 200 },
    ],
  },
  driving: {
    overhead: 4,
    tiers: [
      { upToKm: 10, speed: 26 },
      { upToKm: Infinity, speed: 65 },
    ],
  },
};

/** Estimated travel minutes for a straight-line distance, rounded to 5 minutes. */
export function estimateTravelMinutes(km: number, mode: TransportMode): number {
  const roadKm = km * 1.3; // straight-line -> approximate road/rail distance
  const { overhead, tiers } = TRAVEL[mode];
  let minutes = overhead;
  let covered = 0;
  for (const tier of tiers) {
    const stretch = Math.min(roadKm, tier.upToKm) - covered;
    if (stretch <= 0) break;
    minutes += (stretch / tier.speed) * 60;
    covered += stretch;
  }
  return Math.max(5, Math.round(minutes / 5) * 5);
}

/** "HH:MM" -> minutes past midnight, or null when it is not a clock time. */
export function clockToMinutes(clock: string | undefined): number | null {
  const match = clock ? /^([01]\d|2[0-3]):([0-5]\d)$/.exec(clock) : null;
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Minutes-past-midnight -> "HH:MM" (24h). */
export function formatClock(totalMinutes: number): string {
  const m = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Scheduled visit length (minutes): the midpoint of the estimate range, to 15 min. */
function visitMinutes(place: Place): number {
  const [lo, hi] = durationRangeFor(place);
  const mid = (lo + hi) / 2;
  return Math.round((mid * 60) / 15) * 15;
}

/**
 * Build an estimated clock-time schedule for a day: wake up, then travel to and visit
 * each place in order. Travel starts from `origin` (the accommodation) when given;
 * otherwise the day begins at the first attraction. Times are estimates.
 */
export function buildDaySchedule(
  day: Day,
  origin: NavPoint | null,
  mode: TransportMode,
  opts: ScheduleOptions = {}
): ScheduleEntry[] {
  const wake = opts.wakeMinutes ?? 7 * 60 + 30;
  const buffer = opts.morningBufferMin ?? 90;

  const places = day.places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (places.length === 0) return [];

  const ticketTime = (p: Place) => clockToMinutes(opts.fixedTimes?.[p.id]);

  const entries: ScheduleEntry[] = [];
  entries.push({ kind: "wake", time: wake, label: "Wake up, breakfast & get ready" });

  let t = wake + buffer;
  let fromPoint: NavPoint;
  let startIndex: number;

  if (origin) {
    fromPoint = origin;
    startIndex = 0;
  } else {
    // No accommodation: begin at the first attraction with no leading travel leg.
    const first = places[0];
    const vm = visitMinutes(first);
    // The day simply begins when the ticket says, early or late.
    t = ticketTime(first) ?? t;
    entries.push({ kind: "visit", time: t, endTime: t + vm, place: first });
    t += vm;
    fromPoint = { name: first.name, lat: first.lat, lng: first.lng };
    startIndex = 1;
  }

  for (let i = startIndex; i < places.length; i++) {
    const p = places[i];
    const to: NavPoint = { name: p.name, lat: p.lat, lng: p.lng };
    const km = haversineKm(fromPoint.lat, fromPoint.lng, to.lat, to.lng);
    const travel = estimateTravelMinutes(km, mode);
    const ticket = ticketTime(p);
    // A ticketed first stop sets when the day starts: leave in time to arrive on the dot.
    if (ticket !== null && i === 0) t = ticket - travel;
    entries.push({
      kind: "travel",
      time: t,
      minutes: travel,
      from: fromPoint.name,
      to: to.name,
      mode,
      km,
      url: directionsUrl(null, to, mode),

    });
    t += travel;
    // Early for a ticket means waiting for the slot; late is reported, not hidden.
    let late: number | undefined;
    if (ticket !== null) {
      if (t <= ticket) t = ticket;
      else late = t - ticket;
    }
    const vm = visitMinutes(p);
    entries.push({ kind: "visit", time: t, endTime: t + vm, place: p, ...(late ? { late } : {}) });
    t += vm;
    fromPoint = to;
  }

  const firstMove = entries[1];
  if (firstMove && firstMove.time - buffer < wake) {
    entries[0] = { kind: "wake", time: firstMove.time - buffer, label: "Wake up, breakfast & get ready" };
  }

  return entries;
}

/**
 * Reorder each day so ticketed places land where their entry time allows. Untimed places
 * keep their order; a ticketed place is pulled forward as soon as doing the next untimed
 * stop first would make the traveler late for it. Days without a ticket time are untouched.
 */
export function applyTicketTimes(
  days: Day[],
  fixedTimes: Record<string, string>,
  mode: TransportMode,
  startMinutes = 9 * 60
): Day[] {
  if (Object.keys(fixedTimes).length === 0) return days;

  const hop = (from: Place | null, to: Place) => {
    if (!from) return 0;
    const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
    return Number.isFinite(km) ? estimateTravelMinutes(km, mode) : 0;
  };

  return days.map((day) => {
    const timed = day.places
      .filter((p) => clockToMinutes(fixedTimes[p.id]) !== null)
      .sort((a, b) => clockToMinutes(fixedTimes[a.id])! - clockToMinutes(fixedTimes[b.id])!);
    if (timed.length === 0) return day;
    const untimed = day.places.filter((p) => !timed.includes(p));

    const ordered: Place[] = [];
    let t = startMinutes;
    let current: Place | null = null;
    while (timed.length > 0 || untimed.length > 0) {
      const ticketed = timed[0];
      const next = untimed[0];
      const afterNext = next ? t + hop(current, next) + visitMinutes(next) : 0;
      const takeTicketed =
        ticketed && (!next || afterNext + hop(next, ticketed) > clockToMinutes(fixedTimes[ticketed.id])!);

      if (takeTicketed) {
        timed.shift();
        t = Math.max(t + hop(current, ticketed), clockToMinutes(fixedTimes[ticketed.id])!) + visitMinutes(ticketed);
        ordered.push(ticketed);
        current = ticketed;
      } else {
        untimed.shift();
        t = afterNext;
        ordered.push(next);
        current = next;
      }
    }
    return { ...day, places: ordered };
  });
}
