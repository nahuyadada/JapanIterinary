import type { Place } from "@/data/places";
import type { Day } from "@/lib/itinerary";
import { dayEstimate, type DayVerdict } from "@/lib/duration";
import { toISODate } from "@/lib/lodging";

export type AlternativeDay = {
  dayIndex: number;
  date: Date;
  /** "same" = already in the place's region, "free" = nothing planned, "other" = elsewhere. */
  fit: "same" | "free" | "other";
  /** The region the traveler is in that day, when it is not the place's own. */
  region?: string;
  /** How the day would look with the place added to it. */
  verdict: DayVerdict;
};

const FIT_RANK = { same: 0, free: 1, other: 2 } as const;
const VERDICT_RANK: Record<DayVerdict, number> = { light: 0, full: 1, packed: 2 };

/**
 * Days a place could move to when its tickets are gone for the planned date. Best first:
 * days already spent in the same region, then free days, then days elsewhere; within each,
 * days that stay comfortable once the place is added, then the closest dates.
 */
export function suggestAlternativeDays(
  place: Place,
  days: Day[],
  currentDayIndex: number,
  soldOutDates: string[] = [],
  limit = 3
): AlternativeDay[] {
  const soldOut = new Set(soldOutDates);

  return days
    .filter((d) => d.dayIndex !== currentDayIndex && !soldOut.has(toISODate(d.date)))
    .map((d): AlternativeDay => {
      const region = d.places.find((p) => p.id !== place.id)?.region;
      const withPlace = { ...d, places: [...d.places.filter((p) => p.id !== place.id), place] };
      return {
        dayIndex: d.dayIndex,
        date: d.date,
        fit: region === undefined ? "free" : region === place.region ? "same" : "other",
        ...(region !== undefined && region !== place.region ? { region } : {}),
        verdict: dayEstimate(withPlace).verdict,
      };
    })
    .sort(
      (a, b) =>
        FIT_RANK[a.fit] - FIT_RANK[b.fit] ||
        VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] ||
        Math.abs(a.dayIndex - currentDayIndex) - Math.abs(b.dayIndex - currentDayIndex) ||
        a.dayIndex - b.dayIndex
    )
    .slice(0, limit);
}
