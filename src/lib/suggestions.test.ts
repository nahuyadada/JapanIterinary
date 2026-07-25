import { describe, it, expect } from "vitest";
import { suggestForItinerary } from "@/lib/suggestions";
import { PLACES } from "@/data/places";
import { DAY_HOURS } from "@/lib/itinerary";
import type { Day } from "@/lib/itinerary";
import type { Place } from "@/data/places";

const byId = (id: string): Place => {
  const p = PLACES.find((x) => x.id === id);
  if (!p) throw new Error(`missing test fixture place: ${id}`);
  return p;
};

const day = (dayIndex: number, places: Place[]): Day => ({
  dayIndex,
  date: new Date(2026, 6, 25 + dayIndex),
  places,
});

describe("suggestForItinerary", () => {
  it("suggests nearby unselected same-region attractions when time is free (Kyoto scenario)", () => {
    // Two Kyoto days with only Fushimi Inari planned -> lots of free time.
    const days = [day(0, [byId("kyoto-fushimi")]), day(1, [])];
    const groups = suggestForItinerary(days);

    expect(groups).toHaveLength(1);
    const g = groups[0];
    expect(g.region).toBe("Kyoto");
    expect(g.freeHours).toBeGreaterThan(0);
    // Only Kyoto places, never the already-selected Fushimi.
    expect(g.suggestions.every((p) => p.region === "Kyoto")).toBe(true);
    expect(g.suggestions.some((p) => p.id === "kyoto-fushimi")).toBe(false);
    // Popular Kyoto picks surface.
    const ids = g.suggestions.map((p) => p.id);
    expect(ids).toContain("kyoto-kiyomizu");
  });

  it("respects the limit", () => {
    const days = [day(0, [byId("kyoto-fushimi")]), day(1, [])];
    const groups = suggestForItinerary(days, { limit: 2 });
    expect(groups[0].suggestions).toHaveLength(2);
  });

  it("ranks a preferred-category match ahead of off-category picks", () => {
    // Planned: only a temple-shrine (Fushimi). The top suggestion should also be a
    // temple-shrine, since preferred categories are ranked first.
    const days = [day(0, [byId("kyoto-fushimi")]), day(1, [])];
    const top = suggestForItinerary(days, { limit: 1 })[0].suggestions[0];
    expect(top.category).toBe("temple-shrine");
  });

  it("returns nothing when the schedule is already full", () => {
    // Three 3h Kyoto places on a single day = 9h = DAY_HOURS, no free time.
    const full = [
      byId("kyoto-fushimi"),
      byId("kyoto-kinkakuji"),
      byId("kyoto-gion"),
    ];
    const totalHours = full.reduce((s, p) => s + (p.durationHours ?? 3), 0);
    expect(totalHours).toBe(DAY_HOURS);
    const groups = suggestForItinerary([day(0, full)]);
    expect(groups).toEqual([]);
  });

  it("does not suggest already-selected places", () => {
    const days = [
      day(0, [byId("kyoto-fushimi"), byId("kyoto-kiyomizu")]),
      day(1, []),
    ];
    const ids = suggestForItinerary(days).flatMap((g) => g.suggestions.map((p) => p.id));
    expect(ids).not.toContain("kyoto-fushimi");
    expect(ids).not.toContain("kyoto-kiyomizu");
  });
});
