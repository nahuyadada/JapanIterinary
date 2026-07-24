import type { Place, Region } from "@/data/places";
import { REGIONS } from "@/data/places";

export type Day = { date: Date; dayIndex: number; places: Place[] };

export const MAX_PER_DAY = 4;
const MS_PER_DAY = 86_400_000;

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Inclusive count of calendar days between start and end. */
export function tripDays(start: Date, end: Date): number {
  const a = atMidnight(start).getTime();
  const b = atMidnight(end).getTime();
  return Math.max(1, Math.round((b - a) / MS_PER_DAY) + 1);
}

/** Order selected places so places from the same region are grouped together. */
export function orderByRegion(selected: Place[]): Place[] {
  const byRegion = new Map<Region, Place[]>();
  for (const place of selected) {
    const list = byRegion.get(place.region) ?? [];
    list.push(place);
    byRegion.set(place.region, list);
  }
  return REGIONS.flatMap((r) => byRegion.get(r) ?? []);
}

export function buildItinerary(selected: Place[], start: Date, end: Date): Day[] {
  const count = tripDays(start, end);
  const s = atMidnight(start);
  const days: Day[] = Array.from({ length: count }, (_, i) => ({
    date: new Date(s.getTime() + i * MS_PER_DAY),
    dayIndex: i,
    places: [],
  }));

  const ordered = orderByRegion(selected);
  if (days.length === 0 || ordered.length === 0) return days;

  // Fill each day up to MAX_PER_DAY, keeping the region-grouped order. When we run
  // out of days before places, overflow the remainder onto the last day so nothing
  // is dropped.
  let dayPtr = 0;
  for (const place of ordered) {
    if (dayPtr < days.length - 1 && days[dayPtr].places.length >= MAX_PER_DAY) {
      dayPtr++;
    }
    days[dayPtr].places.push(place);
  }
  return days;
}
