import type { Place } from "@/data/places";
import { DAY_HOURS, placeDuration, type Day } from "@/lib/itinerary";
import { placeDurationRange, type HourRange } from "@/data/placeMeta";

export type { HourRange };

/**
 * Estimated visit-duration range for a place. Uses the curated range when available,
 * otherwise derives a rough band from the place's single `durationHours` value.
 */
export function durationRangeFor(place: Place): HourRange {
  const curated = placeDurationRange(place.id);
  if (curated) return curated;
  const d = placeDuration(place);
  const half = (n: number) => Math.round(n * 2) / 2;
  return [Math.max(0.5, half(d - 1)), half(d + 1)];
}

/** Format a number of hours: 1 -> "1", 1.5 -> "1.5". */
export function formatHours(h: number): string {
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
}

/** Format a range like "2–3 hours" (or "1 hour" when both ends match). */
export function formatRange(range: HourRange): string {
  const [min, max] = range;
  if (min === max) return `${formatHours(min)} ${min === 1 ? "hour" : "hours"}`;
  return `${formatHours(min)}–${formatHours(max)} hours`;
}

export type DayVerdict = "light" | "full" | "packed";

export type DayEstimate = {
  minHours: number;
  maxHours: number;
  /** light = free time remains, full = a comfortably full day, packed = likely over DAY_HOURS. */
  verdict: DayVerdict;
};

/** Total estimated time for a day and whether the schedule is realistic. */
export function dayEstimate(day: Day): DayEstimate {
  let minHours = 0;
  let maxHours = 0;
  for (const p of day.places) {
    const [lo, hi] = durationRangeFor(p);
    minHours += lo;
    maxHours += hi;
  }
  let verdict: DayVerdict;
  if (maxHours > DAY_HOURS) verdict = "packed";
  else if (minHours >= DAY_HOURS - 1.5) verdict = "full";
  else verdict = "light";
  return { minHours, maxHours, verdict };
}
