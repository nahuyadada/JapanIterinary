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
  mode: TransportMode
): SimStep[] {
  const steps: SimStep[] = [];

  for (const day of days) {
    const origin = origins.get(day.dayIndex) ?? null;
    const schedule = buildDaySchedule(day, origin, mode);
    const at = { dayIndex: day.dayIndex, date: day.date };

    const first = schedule.find((entry) => entry.kind !== "wake");
    if (!first) {
      steps.push({ ...at, kind: "free" });
      continue;
    }

    steps.push({ ...at, kind: "leave", time: first.time, baseName: origin?.name });

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
        travelMinutes: back,
      });
    }
  }

  return steps;
}
