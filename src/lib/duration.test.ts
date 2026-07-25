import { describe, it, expect } from "vitest";
import { durationRangeFor, formatHours, formatRange, dayEstimate } from "@/lib/duration";
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

describe("durationRangeFor", () => {
  it("uses the curated range for known attractions (USJ 8-10)", () => {
    expect(durationRangeFor(byId("osaka-usj"))).toEqual([8, 10]);
    expect(durationRangeFor(byId("osaka-castle"))).toEqual([1.5, 2]);
  });

  it("derives a band from durationHours when no curated range exists", () => {
    const custom: Place = { ...byId("osaka-castle"), id: "not-in-meta", durationHours: 3 };
    expect(durationRangeFor(custom)).toEqual([2, 4]);
  });
});

describe("formatHours / formatRange", () => {
  it("formats whole and half hours", () => {
    expect(formatHours(2)).toBe("2");
    expect(formatHours(1.5)).toBe("1.5");
  });

  it("formats ranges", () => {
    expect(formatRange([2, 3])).toBe("2–3 hours");
    expect(formatRange([8, 10])).toBe("8–10 hours");
    expect(formatRange([1, 1])).toBe("1 hour");
    expect(formatRange([2, 2])).toBe("2 hours");
  });
});

describe("dayEstimate", () => {
  it("sums the per-place ranges", () => {
    // Osaka Castle [1.5,2] + Dotonbori [2,4] = [3.5, 6]
    const est = dayEstimate(day(0, [byId("osaka-castle"), byId("osaka-dotonbori")]));
    expect(est.minHours).toBe(3.5);
    expect(est.maxHours).toBe(6);
    expect(est.verdict).toBe("light");
  });

  it("flags a packed day when the max exceeds the day's hours", () => {
    // USJ [8,10] alone: max 10 > DAY_HOURS (9) -> packed
    const est = dayEstimate(day(0, [byId("osaka-usj")]));
    expect(est.maxHours).toBeGreaterThan(DAY_HOURS);
    expect(est.verdict).toBe("packed");
  });

  it("reports an empty day as light with zero hours", () => {
    const est = dayEstimate(day(0, []));
    expect(est).toEqual({ minHours: 0, maxHours: 0, verdict: "light" });
  });
});
