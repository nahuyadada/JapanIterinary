import type { Place, Region } from "@/data/places";
import { haversineKm } from "@/lib/lodging";

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
  /**
   * placeId → local ISO date ("YYYY-MM-DD") the place must be visited on, e.g. a dated
   * USJ or Disney ticket. The rest of the trip is routed around these pins.
   */
  fixedDates?: Record<string, string>;
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
  return orderBetween(selected, startRegion, endRegion, startCity, endCity);
}

/**
 * Orders places to run from `from` to `to` along the corridor. The anchor regions need not
 * contain any of the places: they only fix the direction of travel, so a stretch between
 * two pinned days leaves from the first pin's region and arrives at the second's.
 */
function orderBetween(
  selected: Place[],
  from?: Region,
  to?: Region,
  startCity?: string,
  endCity?: string
): Place[] {
  const present = new Set(selected.map((p) => p.region));
  const anchors = [from, to].filter((r): r is Region => r !== undefined);
  const regionOrder = orderRegions([...present, ...anchors], from, to).filter((r) => present.has(r));
  const startRegion = startCity ? selected.find((p) => p.city === startCity)?.region : undefined;
  const endRegion = endCity ? selected.find((p) => p.city === endCity)?.region : undefined;

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

  if (selected.length === 0) return days;

  const allocations = options.dayAllocations ?? {};
  const pins = resolvePins(selected, days, options.fixedDates ?? {}, allocations);
  if (pins.length === 0) {
    fillDays(days, 0, days.length - 1, orderPlaces(selected, options), allocations);
    return days;
  }

  for (const pin of pins) {
    for (let i = pin.first; i <= pin.last; i++) days[i].places.push(pin.place);
  }

  const pinned = new Set(pins.map((pin) => pin.place.id));
  const { startCity, endCity } = options;
  const startPlaces = startCity ? selected.filter((p) => p.city === startCity) : [];
  const endPlaces = endCity ? selected.filter((p) => p.city === endCity) : [];
  const segments = pinSegments(pins, days.length, startPlaces, endPlaces);
  const free = selected.filter((p) => !pinned.has(p.id));
  const plan = new SegmentPlanner(segments, free, allocations, startPlaces[0]?.region, endPlaces[0]?.region);
  const assigned = plan.assign();

  segments.forEach((seg, i) => {
    if (assigned[i].length === 0) return;
    const ordered = orderBetween(
      assigned[i],
      seg.from,
      seg.to,
      seg.isFirst ? startCity : undefined,
      seg.isLast ? endCity : undefined
    );
    fillDays(days, seg.first, seg.last, ordered, allocations, seg.seed);
  });
  return days;
}

type Pin = { place: Place; first: number; last: number };

/** A run of days between pins, filled independently of the others. */
type Segment = {
  first: number;
  last: number;
  /** Region travel arrives from (the pin opening this stretch, or the start region). */
  from?: Region;
  /** Region travel must reach by the end (the next pin, or the end region). */
  to?: Region;
  fromPoint?: Point;
  toPoint?: Point;
  /** Whole free days available, not counting a partly used pinned first day. */
  capacity: number;
  /** State of the first day when it already holds a pinned place. */
  seed?: { used: number; region: Region };
  isFirst: boolean;
  isLast: boolean;
};

function wantDaysFor(place: Place, allocations: Record<string, number>): number {
  return Math.max(1, Math.floor(allocations[place.id] ?? 1));
}

function isFullDay(place: Place, allocations: Record<string, number>): boolean {
  return wantDaysFor(place, allocations) > 1 || placeDuration(place) >= DAY_HOURS;
}

/** Pins that land inside the trip, earliest first. Dates outside the trip are ignored. */
function resolvePins(
  selected: Place[],
  days: Day[],
  fixedDates: Record<string, string>,
  allocations: Record<string, number>
): Pin[] {
  const pins: Pin[] = [];
  for (const place of selected) {
    const iso = fixedDates[place.id];
    const m = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
    if (!m) continue;
    const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
    const first = days.findIndex((d) => d.date.getTime() === target);
    if (first === -1) continue;
    const last = Math.min(first + wantDaysFor(place, allocations) - 1, days.length - 1);
    pins.push({ place, first, last });
  }
  return pins.sort((a, b) => a.first - b.first || a.last - b.last);
}

/**
 * Splits the trip at its pins: one stretch before the first pin, then one starting on each
 * pin's last day and running up to the next pin. A stretch starts on the pinned day itself
 * so a short pinned visit (a timed museum slot) still shares its day with nearby places.
 */
function pinSegments(pins: Pin[], dayCount: number, startPlaces: Place[], endPlaces: Place[]): Segment[] {
  const segments: Segment[] = [
    {
      first: 0,
      last: pins[0].first - 1,
      from: startPlaces[0]?.region,
      to: pins[0].place.region,
      fromPoint: centroid(startPlaces),
      toPoint: centroid([pins[0].place]),
      capacity: pins[0].first,
      isFirst: true,
      isLast: false,
    },
  ];
  pins.forEach((pin, k) => {
    const next = pins[k + 1];
    const last = next ? next.first - 1 : dayCount - 1;
    // Later pins on the same day as this one own that day's seed instead.
    if (pins.some((other, j) => j > k && other.first <= pin.last)) return;
    const sameDay = pins.filter((other) => other.first <= pin.last && other.last >= pin.last);
    const used = sameDay.some((o) => o.first !== o.last || placeDuration(o.place) >= DAY_HOURS)
      ? DAY_HOURS
      : sameDay.reduce((sum, o) => sum + placeDuration(o.place), 0);
    segments.push({
      first: pin.last,
      last,
      from: pin.place.region,
      to: next ? next.place.region : endPlaces[0]?.region,
      fromPoint: centroid([pin.place]),
      toPoint: centroid(next ? [next.place] : endPlaces),
      capacity: Math.max(0, last - pin.last),
      seed: { used, region: pin.place.region },
      isFirst: false,
      isLast: !next,
    });
  });
  return segments;
}

type Point = { lat: number; lng: number };

function centroid(places: Place[]): Point | undefined {
  const located = places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (located.length === 0) return undefined;
  return {
    lat: located.reduce((sum, p) => sum + p.lat, 0) / located.length,
    lng: located.reduce((sum, p) => sum + p.lng, 0) / located.length,
  };
}

/** Penalty per day a stretch is over capacity: far outweighs any detour, so it is a last resort. */
const OVERFLOW_KM = 5000;
/** Nudge for keeping the start/end city's region in the first/last stretch when travel ties. */
const ANCHOR_KM = 25;
/** Exhaustive search below this many combinations; local search above it. */
const EXHAUSTIVE_LIMIT = 20_000;

/**
 * Decides which stretch between pins each free place belongs to. Whole regions are placed
 * so a city is visited in one go, choosing the layout with the least real travel distance
 * (each stretch runs from its opening pin, through its regions in corridor order, to the
 * next pin). A region is split across stretches only when none can hold it whole.
 */
class SegmentPlanner {
  private readonly regions: Region[];
  private readonly groups: Map<Region, Place[]>;
  private readonly usable: number[];

  constructor(
    private readonly segments: Segment[],
    free: Place[],
    private readonly allocations: Record<string, number>,
    private readonly startRegion?: Region,
    private readonly endRegion?: Region
  ) {
    this.groups = new Map();
    for (const p of free) this.groups.set(p.region, [...(this.groups.get(p.region) ?? []), p]);
    this.regions = [...this.groups.keys()];
    this.usable = segments.map((_, i) => i).filter((i) => segments[i].last >= segments[i].first);
  }

  assign(): Place[][] {
    const choice = this.chooseRegions();
    const assigned: Place[][] = this.segments.map(() => []);
    this.regions.forEach((r, i) => assigned[choice[i]].push(...this.groups.get(r)!));
    this.spillOverflow(assigned);
    this.topUpPinnedDays(assigned);
    return assigned;
  }

  /**
   * A short pinned visit leaves hours spare on its day. Pull same-region places from the days
   * just before it to use them: the route is unchanged, the day is just less empty.
   */
  private topUpPinnedDays(assigned: Place[][]): void {
    this.segments.forEach((seg, s) => {
      if (!seg.seed) return;
      let spare = DAY_HOURS - seg.seed.used - assigned[s]
        .filter((p) => p.region === seg.seed!.region && !isFullDay(p, this.allocations))
        .reduce((sum, p) => sum + placeDuration(p), 0);
      const prev = this.segments.findIndex((other) => other.last === seg.first - 1);
      if (prev === -1 || spare <= 0) return;
      for (const place of [...assigned[prev]].reverse()) {
        if (place.region !== seg.seed.region || isFullDay(place, this.allocations)) continue;
        if (placeDuration(place) > spare) continue;
        spare -= placeDuration(place);
        assigned[prev] = assigned[prev].filter((p) => p !== place);
        assigned[s].unshift(place);
      }
    });
  }

  private segmentCost(i: number, places: Place[]): number {
    const seg = this.segments[i];
    const present = [...new Set(places.map((p) => p.region))];
    const anchors = [seg.from, seg.to].filter((r): r is Region => r !== undefined);
    const order = orderRegions([...present, ...anchors], seg.from, seg.to).filter((r) => present.includes(r));
    const stops = [
      seg.fromPoint,
      ...order.map((r) => centroid(places.filter((p) => p.region === r))),
      seg.toPoint,
    ].filter((pt): pt is Point => pt !== undefined);
    let total = 0;
    for (let k = 1; k < stops.length; k++) {
      total += haversineKm(stops[k - 1].lat, stops[k - 1].lng, stops[k].lat, stops[k].lng);
    }
    const over = Math.max(0, daysNeeded(seg, places, this.allocations) - seg.capacity);
    // Earlier stretches win exact ties, so spare days collect at the end as without pins.
    return total + over * OVERFLOW_KM + (places.length > 0 ? i * 0.01 : 0);
  }

  private cost(assigned: Place[][]): number {
    let total = 0;
    for (const i of this.usable) total += this.segmentCost(i, assigned[i]);
    const first = this.usable[0];
    const last = this.usable[this.usable.length - 1];
    if (this.startRegion && assigned.some((ps, i) => i !== first && ps.some((p) => p.region === this.startRegion))) {
      total += ANCHOR_KM;
    }
    if (this.endRegion && assigned.some((ps, i) => i !== last && ps.some((p) => p.region === this.endRegion))) {
      total += ANCHOR_KM;
    }
    return total;
  }

  private costOfChoice(choice: number[]): number {
    const assigned: Place[][] = this.segments.map(() => []);
    choice.forEach((s, i) => {
      if (s >= 0) assigned[s].push(...this.groups.get(this.regions[i])!);
    });
    return this.cost(assigned);
  }

  /** The segment index for each region. */
  private chooseRegions(): number[] {
    const n = this.regions.length;
    const u = this.usable.length;
    if (Math.pow(u, n) <= EXHAUSTIVE_LIMIT) {
      let best: number[] = [];
      let bestCost = Infinity;
      const choice = new Array<number>(n).fill(-1);
      const walk = (i: number) => {
        if (i === n) {
          const c = this.costOfChoice(choice);
          if (c < bestCost) [bestCost, best] = [c, [...choice]];
          return;
        }
        for (const s of this.usable) {
          choice[i] = s;
          walk(i + 1);
        }
      };
      walk(0);
      return best;
    }

    // Greedy (largest regions first), then move single regions while that helps.
    const choice = new Array<number>(n).fill(-1);
    const hours = (r: Region) => this.groups.get(r)!.reduce((sum, p) => sum + placeDuration(p), 0);
    const order = this.regions.map((_, i) => i).sort((a, b) => hours(this.regions[b]) - hours(this.regions[a]));
    for (const i of order) {
      let best = this.usable[0];
      let bestCost = Infinity;
      for (const s of this.usable) {
        choice[i] = s;
        const c = this.costOfChoice(choice);
        if (c < bestCost) [bestCost, best] = [c, s];
      }
      choice[i] = best;
    }
    let current = this.costOfChoice(choice);
    for (let improved = true; improved; ) {
      improved = false;
      for (let i = 0; i < n; i++) {
        const was = choice[i];
        for (const s of this.usable) {
          if (s === was) continue;
          choice[i] = s;
          const c = this.costOfChoice(choice);
          if (c < current - 1e-9) {
            current = c;
            improved = true;
            break;
          }
          choice[i] = was;
        }
      }
    }
    return choice;
  }

  /** Move single places out of over-full stretches into the cheapest one with room. */
  private spillOverflow(assigned: Place[][]): void {
    for (const s of this.usable) {
      const seg = this.segments[s];
      while (daysNeeded(seg, assigned[s], this.allocations) > seg.capacity) {
        let best: { place: Place; to: number; cost: number } | null = null;
        for (const place of assigned[s]) {
          for (const t of this.usable) {
            if (t === s) continue;
            const target = this.segments[t];
            if (daysNeeded(target, [...assigned[t], place], this.allocations) > target.capacity) continue;
            const trial = assigned.map((ps, i) =>
              i === s ? ps.filter((p) => p !== place) : i === t ? [...ps, place] : ps
            );
            const c = this.cost(trial);
            if (!best || c < best.cost) best = { place, to: t, cost: c };
          }
        }
        if (!best) break;
        assigned[s] = assigned[s].filter((p) => p !== best!.place);
        assigned[best.to].push(best.place);
      }
    }
  }
}

/** Whole days these places need in a stretch, crediting the pinned day's spare hours. */
function daysNeeded(seg: Segment, places: Place[], allocations: Record<string, number>): number {
  const hours = new Map<Region, number>();
  for (const place of places) {
    const h = isFullDay(place, allocations) ? DAY_HOURS * wantDaysFor(place, allocations) : placeDuration(place);
    hours.set(place.region, (hours.get(place.region) ?? 0) + h);
  }
  let total = 0;
  for (const [region, h] of hours) {
    const spare = seg.seed && seg.seed.region === region ? DAY_HOURS - seg.seed.used : 0;
    total += Math.ceil(Math.max(0, h - spare) / DAY_HOURS);
  }
  return total;
}

/**
 * Packs places into days[first..last] in order. On the last day of the range it stays put
 * and lets the remainder overflow, so nothing is ever dropped.
 */
function fillDays(
  days: Day[],
  first: number,
  last: number,
  ordered: Place[],
  allocations: Record<string, number>,
  seed?: { used: number; region: Region }
): void {
  let ptr = first;
  let used = seed?.used ?? 0;
  let dayRegion: Region | null = seed?.region ?? null;
  const advance = (): boolean => {
    if (ptr < last) {
      ptr++;
      used = 0;
      dayRegion = null;
      return true;
    }
    return false;
  };

  for (const place of ordered) {
    const wantDays = wantDaysFor(place, allocations);
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
}
