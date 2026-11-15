import { describe, it, expect } from "vitest";
import { buildSimulation } from "@/lib/simulation";
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

const HOTEL: NavPoint = { name: "Hotel", lat: 35.7101, lng: 139.8107 };

describe("buildSimulation", () => {
  it("walks a day from the base, through each stop, and back", () => {
    const days = [day(0, [byId("tokyo-sensoji"), byId("tokyo-meiji")])];
    const steps = buildSimulation(days, new Map([[0, HOTEL]]), "transit");

    expect(steps.map((s) => s.kind)).toEqual(["leave", "visit", "visit", "return"]);
    expect(steps[0].baseName).toBe("Hotel");
    expect(steps[1].place?.id).toBe("tokyo-sensoji");
    expect(steps[1].travelMinutes).toBeGreaterThan(0);
    expect(steps[3].travelMinutes).toBeGreaterThan(0);

    const times = steps.map((s) => s.time ?? 0);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(steps[3].time).toBeGreaterThan(steps[2].endTime ?? 0);
  });

  it("starts at the first stop when the day has no base", () => {
    const steps = buildSimulation([day(0, [byId("tokyo-sensoji")])], new Map(), "transit");
    expect(steps.map((s) => s.kind)).toEqual(["leave", "visit", "return"]);
    expect(steps[1].travelMinutes).toBeUndefined();
    expect(steps[2].travelMinutes).toBeUndefined();
    expect(steps[2].time).toBe(steps[1].endTime);
  });

  it("marks a day with nothing planned as free", () => {
    const steps = buildSimulation([day(0, []), day(1, [byId("tokyo-sensoji")])], new Map(), "transit");
    expect(steps[0]).toMatchObject({ dayIndex: 0, kind: "free" });
    expect(steps[1]).toMatchObject({ dayIndex: 1, kind: "leave" });
  });
});
