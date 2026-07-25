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
  | { kind: "visit"; time: number; endTime: number; place: Place };

// Rough effective speeds (km/h) and fixed overhead (min) per mode. These produce an
// ESTIMATE only — real routing and departure times come from the Google Maps links.
const TRAVEL: Record<TransportMode, { speed: number; overhead: number }> = {
  walking: { speed: 4.8, overhead: 0 },
  transit: { speed: 18, overhead: 8 },
  driving: { speed: 26, overhead: 4 },
};

/** Estimated travel minutes for a straight-line distance, rounded to 5 minutes. */
export function estimateTravelMinutes(km: number, mode: TransportMode): number {
  const roadKm = km * 1.3; // straight-line -> approximate road/rail distance
  const { speed, overhead } = TRAVEL[mode];
  const minutes = (roadKm / speed) * 60 + overhead;
  return Math.max(5, Math.round(minutes / 5) * 5);
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
    const vm = visitMinutes(p);
    entries.push({ kind: "visit", time: t, endTime: t + vm, place: p });
    t += vm;
    fromPoint = to;
  }

  return entries;
}
