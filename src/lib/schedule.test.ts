import { describe, it, expect } from "vitest";
import { estimateTravelMinutes, formatClock, buildDaySchedule } from "@/lib/schedule";
import { PLACES } from "@/data/places";
import type { Day } from "@/lib/itinerary";
import type { Place } from "@/data/places";
import type { NavPoint } from "@/lib/navigation";

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

describe("estimateTravelMinutes", () => {
  it("is at least 5 minutes and rounded to 5", () => {
    const m = estimateTravelMinutes(0.1, "walking");
    expect(m).toBe(5);
    expect(m % 5).toBe(0);
  });

  it("grows with distance and is faster by transit than on foot", () => {
    expect(estimateTravelMinutes(10, "transit")).toBeLessThan(estimateTravelMinutes(10, "walking"));
    expect(estimateTravelMinutes(20, "transit")).toBeGreaterThan(estimateTravelMinutes(5, "transit"));
  });
});

describe("formatClock", () => {
  it("formats minutes past midnight as HH:MM", () => {
    expect(formatClock(7 * 60 + 30)).toBe("07:30");
    expect(formatClock(10 * 60 + 5)).toBe("10:05");
    expect(formatClock(0)).toBe("00:00");
  });
});

describe("buildDaySchedule", () => {
  const namba: NavPoint = { name: "Namba", lat: 34.6659, lng: 135.5012 };

  it("returns [] for an empty day", () => {
    expect(buildDaySchedule(day(0, []), namba, "transit")).toEqual([]);
  });

  it("starts with a wake entry, then travel to and a visit at each place (USJ example)", () => {
    const schedule = buildDaySchedule(day(0, [byId("osaka-usj")]), namba, "transit");

    expect(schedule[0]).toMatchObject({ kind: "wake", time: 7 * 60 + 30 });
    const travel = schedule.find((e) => e.kind === "travel");
    const visit = schedule.find((e) => e.kind === "visit");
    expect(travel).toBeDefined();
    expect(visit).toBeDefined();
    if (travel?.kind === "travel") {
      expect(travel.from).toBe("Namba");
      expect(travel.to).toBe("Universal Studios Japan");
      expect(travel.url).toContain("google.com/maps/dir");
      // leaves after the morning buffer (07:30 + 90 = 09:00)
      expect(travel.time).toBe(9 * 60);
    }
    if (visit?.kind === "visit") {
      expect(visit.place.id).toBe("osaka-usj");
      expect(visit.endTime).toBeGreaterThan(visit.time);
    }
  });

  it("without an origin, begins at the first attraction (no leading travel leg)", () => {
    const schedule = buildDaySchedule(
      day(0, [byId("osaka-dotonbori"), byId("osaka-castle")]),
      null,
      "transit"
    );
    // wake, then a visit (not a travel) as the first activity
    expect(schedule[0].kind).toBe("wake");
    expect(schedule[1].kind).toBe("visit");
    // one travel leg between the two places
    expect(schedule.filter((e) => e.kind === "travel")).toHaveLength(1);
  });
});
