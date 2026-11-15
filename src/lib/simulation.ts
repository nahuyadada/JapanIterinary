import type { Place } from "@/data/places";
import type { Day } from "@/lib/itinerary";
import { haversineKm } from "@/lib/lodging";
import type { NavPoint, TransportMode } from "@/lib/navigation";
import { buildDaySchedule, estimateTravelMinutes } from "@/lib/schedule";

/**
 * One moment in a dry run of the trip. Times are minutes past midnight and come from the
 * same estimates the planner shows, so they are a rehearsal, not a timetable.
 */
export type SimStep = {
  dayIndex: number;
  date: Date;
  kind: "leave" | "visit" | "return" | "free";
  /** Clock time the step happens; absent on a free day. */
  time?: number;
  /** When a visit is expected to end. */
  endTime?: number;
  place?: Place;
  /** Where the traveler sets off from or comes back to, when the day has a base. */
  baseName?: string;
  /** The base itself, when it has a position on the map. */
  base?: NavPoint;
  /** Estimated minutes of travel that lead into this step. */
  travelMinutes?: number;
};

/**
 * Flatten the trip into the ordered steps a traveler would live through: leave the base,
 * reach each stop, get back. `origins` gives each day's base when it has coordinates; a
 * day without one starts at its first stop and ends at its last.
 */
export function buildSimulation(
  days: Day[],
  origins: Map<number, NavPoint>,
  mode: TransportMode,
  fixedTimes: Record<string, string> = {}
): SimStep[] {
  const steps: SimStep[] = [];

  for (const day of days) {
    const origin = origins.get(day.dayIndex) ?? null;
    const schedule = buildDaySchedule(day, origin, mode, { fixedTimes });
    const at = { dayIndex: day.dayIndex, date: day.date };

    const first = schedule.find((entry) => entry.kind !== "wake");
    if (!first) {
      steps.push({ ...at, kind: "free" });
      continue;
    }

    steps.push({ ...at, kind: "leave", time: first.time, baseName: origin?.name, base: origin ?? undefined });

    let travelMinutes: number | undefined;
    let last: { place: Place; endTime: number } | null = null;
    for (const entry of schedule) {
      if (entry.kind === "travel") travelMinutes = entry.minutes;
      if (entry.kind !== "visit") continue;
      steps.push({
        ...at,
        kind: "visit",
        time: entry.time,
        endTime: entry.endTime,
        place: entry.place,
        travelMinutes,
      });
      travelMinutes = undefined;
      last = { place: entry.place, endTime: entry.endTime };
    }

    if (last) {
      const back = origin
        ? estimateTravelMinutes(haversineKm(last.place.lat, last.place.lng, origin.lat, origin.lng), mode)
        : undefined;
      steps.push({
        ...at,
        kind: "return",
        time: last.endTime + (back ?? 0),
        baseName: origin?.name,
        base: origin ?? undefined,
        travelMinutes: back,
      });
    }
  }

  return steps;
}

/** One journey between two points of a day, ending at the step it leads into. */
export type SimHop = {
  /** Index into the trip's steps of the arrival this hop produces. */
  stepIndex: number;
  from: NavPoint;
  to: NavPoint;
  depart: number;
  arrive: number;
};

/** The journeys of one day, in order: base to first stop, stop to stop, last stop to base. */
export function dayHops(steps: SimStep[], dayIndex: number): SimHop[] {
  const hops: SimHop[] = [];
  let from: NavPoint | null = null;

  steps.forEach((step, stepIndex) => {
    if (step.dayIndex !== dayIndex || step.time === undefined) return;
    const to: NavPoint | null =
      step.kind === "visit" && step.place
        ? { name: step.place.name, lat: step.place.lat, lng: step.place.lng }
        : step.base ?? null;
    if (from && to && step.kind !== "leave" && step.travelMinutes !== undefined) {
      hops.push({ stepIndex, from, to, depart: step.time - step.travelMinutes, arrive: step.time });
    }
    if (to) from = to;
  });

  return hops;
}

/** A stretch of a hop done one way: on foot, on a train, or by car. */
export type HopSegment = {
  kind: "walk" | "train" | "drive";
  from: NavPoint;
  to: NavPoint;
  start: number;
  end: number;
};

/** Below this, taking a train costs more time than it saves. */
const WALKABLE_KM = 1.2;
/** A train leg shorter than this is not a believable ride. */
const MIN_RIDE_MINUTES = 3;

function walkMinutes(from: NavPoint, to: NavPoint): number {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng) * 1.3;
  return Math.max(1, Math.round((km / 4.8) * 60));
}

/**
 * Split a hop into walk, train, walk using the stations nearest each end. The hop's own
 * departure and arrival are kept, so the pieces always add up to the time the schedule
 * already shows. Without two distinct stations, or when the walks would leave no time for
 * a ride, the hop stays one piece.
 */
export function hopSegments(
  hop: SimHop,
  mode: TransportMode,
  fromStation: NavPoint | null,
  toStation: NavPoint | null
): HopSegment[] {
  const whole = (kind: HopSegment["kind"]): HopSegment[] => [
    { kind, from: hop.from, to: hop.to, start: hop.depart, end: hop.arrive },
  ];
  if (mode === "walking") return whole("walk");
  if (mode === "driving") return whole("drive");

  const directKm = haversineKm(hop.from.lat, hop.from.lng, hop.to.lat, hop.to.lng);
  if (directKm < WALKABLE_KM) return whole("walk");

  const sameStation =
    fromStation &&
    toStation &&
    haversineKm(fromStation.lat, fromStation.lng, toStation.lat, toStation.lng) < 0.2;
  if (!fromStation || !toStation || sameStation) return whole("train");

  const walkIn = walkMinutes(hop.from, fromStation);
  const walkOut = walkMinutes(toStation, hop.to);
  if (hop.arrive - hop.depart - walkIn - walkOut < MIN_RIDE_MINUTES) return whole("train");

  const board = hop.depart + walkIn;
  const alight = hop.arrive - walkOut;
  return [
    { kind: "walk", from: hop.from, to: fromStation, start: hop.depart, end: board },
    { kind: "train", from: fromStation, to: toStation, start: board, end: alight },
    { kind: "walk", from: toStation, to: hop.to, start: alight, end: hop.arrive },
  ];
}
