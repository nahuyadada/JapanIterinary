import { describe, it, expect } from "vitest";
import { suggestAlternativeDays } from "@/lib/alternatives";
import { PLACES } from "@/data/places";
import type { Day } from "@/lib/itinerary";
import type { Place } from "@/data/places";

const byId = (id: string): Place => {
  const p = PLACES.find((x) => x.id === id);
  if (!p) throw new Error(`missing test fixture place: ${id}`);
  return p;
};

const day = (dayIndex: number, places: Place[]): Day => ({
  dayIndex,
  date: new Date(2026, 11, 21 + dayIndex),
  places,
});

const TEAMLAB = byId("tokyo-teamlab");

describe("suggestAlternativeDays", () => {
  const days = [
    day(0, [byId("kyoto-fushimi")]),
    day(1, []),
    day(2, [TEAMLAB]),
    day(3, [byId("tokyo-sensoji")]),
  ];

  it("prefers days in the same region, then free days, then other regions", () => {
    const options = suggestAlternativeDays(TEAMLAB, days, 2);
    expect(options.map((o) => [o.dayIndex, o.fit])).toEqual([
      [3, "same"],
      [1, "free"],
      [0, "other"],
    ]);
    expect(options[2].region).toBe("Kyoto");
  });

  it("never offers the current day or a date already marked sold out", () => {
    const options = suggestAlternativeDays(TEAMLAB, days, 2, ["2026-12-24"]);
    expect(options.map((o) => o.dayIndex)).toEqual([1, 0]);
  });

  it("ranks a day that would become overbooked below one that stays comfortable", () => {
    const tokyo = PLACES.filter((p) => p.region === "Tokyo" && p.id !== TEAMLAB.id);
    const crowded = [day(0, tokyo.slice(0, 8)), day(1, [TEAMLAB]), day(2, [tokyo[8]])];
    const options = suggestAlternativeDays(TEAMLAB, crowded, 1);
    expect(options[0].dayIndex).toBe(2);
    expect(options[1]).toMatchObject({ dayIndex: 0, verdict: "packed" });
  });
});
