import { PLACES, type Place, type Category, type Region } from "@/data/places";
import { DAY_HOURS, DEFAULT_DURATION_HOURS, placeDuration, type Day } from "@/lib/itinerary";
import { groupStays, haversineKm } from "@/lib/lodging";
import { placePopularity } from "@/data/placeMeta";

export type StaySuggestion = {
  region: Region;
  dayIndexes: number[];
  /** Hours of unscheduled sightseeing time across the stay. */
  freeHours: number;
  /** Recommended unselected attractions, best-first. */
  suggestions: Place[];
};

/** Mean great-circle distance (km) from a candidate to the stay's planned attractions. */
function meanDistanceKm(candidate: Place, refs: Place[]): number {
  const coords = refs.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (coords.length === 0) return 0;
  const total = coords.reduce(
    (s, p) => s + haversineKm(candidate.lat, candidate.lng, p.lat, p.lng),
    0
  );
  return total / coords.length;
}

/**
 * Find under-scheduled stays and suggest nearby unselected attractions that fit the
 * free time. Ranking, best-first: attractions matching a category the traveler already
 * chose, then by popularity, then by proximity to the stay's attractions, then id.
 * A stay is under-scheduled when its free hours reach `minFreeHours`.
 */
export function suggestForItinerary(
  days: Day[],
  opts: { limit?: number; minFreeHours?: number } = {}
): StaySuggestion[] {
  const limit = opts.limit ?? 5;
  const minFreeHours = opts.minFreeHours ?? DEFAULT_DURATION_HOURS;

  const selectedIds = new Set(days.flatMap((d) => d.places.map((p) => p.id)));
  const preferredCategories = new Set<Category>(
    days.flatMap((d) => d.places.map((p) => p.category))
  );

  const out: StaySuggestion[] = [];
  for (const stay of groupStays(days)) {
    const capacity = stay.dayIndexes.length * DAY_HOURS;
    const scheduled = stay.places.reduce((s, p) => s + placeDuration(p), 0);
    const freeHours = capacity - scheduled;
    if (freeHours < minFreeHours) continue;

    const candidates = PLACES.filter(
      (p) =>
        p.region === stay.region &&
        !selectedIds.has(p.id) &&
        placeDuration(p) <= freeHours
    );
    if (candidates.length === 0) continue;

    const ranked = [...candidates].sort((a, b) => {
      const prefA = preferredCategories.has(a.category) ? 0 : 1;
      const prefB = preferredCategories.has(b.category) ? 0 : 1;
      if (prefA !== prefB) return prefA - prefB;
      const popDiff = placePopularity(b.id) - placePopularity(a.id);
      if (popDiff !== 0) return popDiff;
      const distDiff = meanDistanceKm(a, stay.places) - meanDistanceKm(b, stay.places);
      if (distDiff !== 0) return distDiff;
      return a.id.localeCompare(b.id);
    });

    out.push({
      region: stay.region,
      dayIndexes: stay.dayIndexes,
      freeHours,
      suggestions: ranked.slice(0, limit),
    });
  }
  return out;
}
