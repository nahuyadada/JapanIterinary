import { describe, it, expect } from "vitest";
import { buildSimulation, dayHops, hopSegments } from "@/lib/simulation";
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

describe("dayHops", () => {
  it("lists the journeys of one day only, ending back at the base", () => {
    const days = [
      day(0, [byId("tokyo-sensoji"), byId("tokyo-meiji")]),
      day(1, [byId("tokyo-teamlab")]),
    ];
    const steps = buildSimulation(days, new Map([[0, HOTEL], [1, HOTEL]]), "transit");
    const hops = dayHops(steps, 0);

    expect(hops.map((h) => [h.from.name, h.to.name])).toEqual([
      ["Hotel", byId("tokyo-sensoji").name],
      [byId("tokyo-sensoji").name, byId("tokyo-meiji").name],
      [byId("tokyo-meiji").name, "Hotel"],
    ]);
    expect(hops.every((h) => steps[h.stepIndex].dayIndex === 0)).toBe(true);
    expect(hops.every((h) => h.arrive > h.depart)).toBe(true);
  });
});

describe("hopSegments", () => {
  const from: NavPoint = { name: "Hotel", lat: 34.6695, lng: 135.4985 };
  const to: NavPoint = { name: "Fushimi Inari", lat: 34.9671, lng: 135.7727 };
  const hop = { stepIndex: 1, from, to, depart: 540, arrive: 610 };
  const namba: NavPoint = { name: "Namba", lat: 34.6664, lng: 135.5013 };
  const inari: NavPoint = { name: "Inari", lat: 34.9688, lng: 135.7705 };

  it("splits a transit hop into walk, train, walk that add up to the hop", () => {
    const segments = hopSegments(hop, "transit", namba, inari);
    expect(segments.map((s) => s.kind)).toEqual(["walk", "train", "walk"]);
    expect(segments[0].start).toBe(540);
    expect(segments[2].end).toBe(610);
    expect(segments[0].end).toBe(segments[1].start);
    expect(segments[1].end).toBe(segments[2].start);
    expect(segments[1].from.name).toBe("Namba");
    expect(segments[1].to.name).toBe("Inari");
  });

  it("keeps the hop whole when a station is missing or the trip is not by transit", () => {
    expect(hopSegments(hop, "transit", namba, null).map((s) => s.kind)).toEqual(["train"]);
    expect(hopSegments(hop, "walking", namba, inari).map((s) => s.kind)).toEqual(["walk"]);
    expect(hopSegments(hop, "driving", namba, inari).map((s) => s.kind)).toEqual(["drive"]);
  });

  it("walks a hop that is too short to be worth a train", () => {
    const near = { ...hop, to: { name: "Dotonbori", lat: 34.6687, lng: 135.5013 }, arrive: 550 };
    expect(hopSegments(near, "transit", namba, namba).map((s) => s.kind)).toEqual(["walk"]);
  });
});
