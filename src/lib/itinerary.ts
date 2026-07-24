import type { Place, Region } from "@/data/places";

export type Day = { date: Date; dayIndex: number; places: Place[] };

/** Hours of sightseeing time assumed available per day. */
export const DAY_HOURS = 9;
export const DEFAULT_DURATION_HOURS = 3;
const MS_PER_DAY = 86_400_000;

/**
 * Regions in main-corridor travel order — roughly the Shinkansen spine from
 * Hokkaido down to Kyushu, with Okinawa (a flight) at the far end. Routing
 * treats this as a line and sweeps along it to minimize backtracking.
 */
export const ROUTE_ORDER: Region[] = [
  "Sapporo / Hokkaido",
  "Tohoku",
  "Tokyo",
  "Hakone / Fuji",
  "Chubu (Nagoya / Kanazawa / Takayama)",
  "Kyoto",
  "Nara",
  "Osaka",
  "Kobe / Himeji",
  "Chugoku (Okayama / Tottori)",
  "Shikoku",
  "Hiroshima",
  "Kyushu (Fukuoka / Beppu / Nagasaki)",
  "Okinawa",
];

function spineIndex(r: Region): number {
  const i = ROUTE_ORDER.indexOf(r);
  return i === -1 ? ROUTE_ORDER.length : i;
}

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Inclusive count of calendar days between start and end. */
export function tripDays(start: Date, end: Date): number {
  const a = atMidnight(start).getTime();
  const b = atMidnight(end).getTime();
  return Math.max(1, Math.round((b - a) / MS_PER_DAY) + 1);
}

/**
 * Orders the trip's regions along the travel corridor. With a start and end
 * region the route runs start → end, picking up any regions "behind" the start
 * first (nearest first) so the trip still finishes at the end region. With only
 * a start, the shorter side of the corridor is swept before the longer one.
 * With neither, regions simply follow the corridor north → south.
 */
export function orderRegions(
  regions: Region[],
  startRegion?: Region,
  endRegion?: Region
): Region[] {
  const unique = [...new Set(regions)];
  const bySpine = (a: Region, b: Region) => spineIndex(a) - spineIndex(b);
  const start = startRegion && unique.includes(startRegion) ? startRegion : undefined;
  const end = endRegion && unique.includes(endRegion) ? endRegion : undefined;

  if (!start && !end) return unique.sort(bySpine);

  if (!start && end) {
    // Sweep toward the end region: farthest from it first.
    const e = spineIndex(end);
    return unique.sort(
      (a, b) => Math.abs(spineIndex(b) - e) - Math.abs(spineIndex(a) - e) || bySpine(a, b)
    );
  }

  const s = spineIndex(start!);

  if (start && !end) {
    const left = unique.filter((r) => spineIndex(r) < s).sort(bySpine).reverse();
    const right = unique.filter((r) => spineIndex(r) > s).sort(bySpine);
    const leftExtent = left.length ? s - spineIndex(left[left.length - 1]) : 0;
    const rightExtent = right.length ? spineIndex(right[right.length - 1]) - s : 0;
    const [first, second] = leftExtent <= rightExtent ? [left, right] : [right, left];
    return [start, ...first, ...second];
  }

  // Both ends known: travel direction is start → end along the corridor.
  const dir = spineIndex(end!) >= s ? 1 : -1;
  const pos = (r: Region) => (spineIndex(r) - s) * dir;
  const middle = unique.filter((r) => r !== start && r !== end);
  const behind = middle.filter((r) => pos(r) < 0).sort((a, b) => pos(b) - pos(a));
  const forward = middle.filter((r) => pos(r) >= 0).sort((a, b) => pos(a) - pos(b));
  return start === end ? [start!, ...behind, ...forward] : [start!, ...behind, ...forward, end!];
}

export type ItineraryOptions = {
  startCity?: string;
  endCity?: string;
  /** placeId → number of full days to allocate (for multi-day places like USJ). */
  dayAllocations?: Record<string, number>;
};

export function placeDuration(p: Place): number {
  return p.durationHours ?? DEFAULT_DURATION_HOURS;
}

/**
 * Orders selected places for the itinerary: regions follow the travel corridor
 * (see orderRegions), the start city's places lead the start region so the
 * first days stay anchored there, and the end city's places close the trip.
 */
export function orderPlaces(selected: Place[], options: ItineraryOptions = {}): Place[] {
  const { startCity, endCity } = options;
  const startRegion = startCity ? selected.find((p) => p.city === startCity)?.region : undefined;
  const endRegion = endCity ? selected.find((p) => p.city === endCity)?.region : undefined;
  const regionOrder = orderRegions(selected.map((p) => p.region), startRegion, endRegion);

  const out: Place[] = [];
  for (const region of regionOrder) {
    let group = selected.filter((p) => p.region === region);
    if (startCity && region === startRegion) {
      group = [...group.filter((p) => p.city === startCity), ...group.filter((p) => p.city !== startCity)];
    }
    if (endCity && region === endRegion) {
      group = [...group.filter((p) => p.city !== endCity), ...group.filter((p) => p.city === endCity)];
    }
    out.push(...group);
  }
  return out;
}

export function buildItinerary(
  selected: Place[],
  start: Date,
  end: Date,
  options: ItineraryOptions = {}
): Day[] {
  const count = tripDays(start, end);
  const s = atMidnight(start);
  const days: Day[] = Array.from({ length: count }, (_, i) => ({
    date: new Date(s.getTime() + i * MS_PER_DAY),
    dayIndex: i,
    places: [],
  }));

  const ordered = orderPlaces(selected, options);
  if (days.length === 0 || ordered.length === 0) return days;

  const allocations = options.dayAllocations ?? {};
  let ptr = 0;
  let used = 0;
  let dayRegion: Region | null = null;
  // Move to the next day if one exists; on the last day we stay put and let
  // remaining places overflow so nothing is dropped.
  const advance = (): boolean => {
    if (ptr < days.length - 1) {
      ptr++;
      used = 0;
      dayRegion = null;
      return true;
    }
    return false;
  };

  for (const place of ordered) {
    const wantDays = Math.max(1, Math.floor(allocations[place.id] ?? 1));
    const dur = placeDuration(place);

    // Start a fresh day when moving to a new region: a real multi-city trip doesn't
    // mix, say, Tokyo and Osaka into one day just because the hours happen to fit.
    if (dayRegion !== null && place.region !== dayRegion && used > 0) advance();

    if (wantDays > 1 || dur >= DAY_HOURS) {
      // Full-day or multi-day place: it gets whole days to itself.
      if (used > 0) advance();
      days[ptr].places.push(place);
      dayRegion = place.region;
      for (let extra = 1; extra < wantDays; extra++) {
        if (!advance()) break;
        days[ptr].places.push(place);
        dayRegion = place.region;
      }
      used = DAY_HOURS;
      continue;
    }

    if (used > 0 && used + dur > DAY_HOURS) advance();
    days[ptr].places.push(place);
    dayRegion = place.region;
    used += dur;
  }
  return days;
}
