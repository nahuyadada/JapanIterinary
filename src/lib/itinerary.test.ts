import { describe, it, expect } from "vitest";
import { buildItinerary, tripDays, orderRegions, DAY_HOURS } from "./itinerary";
import type { Place, Region } from "@/data/places";

const p = (
  id: string,
  region: Place["region"],
  city: string = "",
  durationHours?: number,
  maxDays?: number
): Place => ({
  id,
  name: id,
  city,
  region,
  category: "landmark",
  description: "",
  lat: 0,
  lng: 0,
  durationHours,
  maxDays,
  activities: [],
});

describe("tripDays", () => {
  it("is inclusive of both endpoints", () => {
    expect(tripDays(new Date("2026-04-01"), new Date("2026-04-03"))).toBe(3);
  });
  it("is 1 for a single-day trip", () => {
    expect(tripDays(new Date("2026-04-01"), new Date("2026-04-01"))).toBe(1);
  });
});

describe("orderRegions", () => {
  it("follows the travel corridor north to south with no preferences", () => {
    expect(orderRegions(["Osaka", "Tokyo", "Kyoto"])).toEqual(["Tokyo", "Kyoto", "Osaka"]);
  });

  it("starts at the start region and sweeps toward the end region", () => {
    const order = orderRegions(
      ["Tokyo", "Kyoto", "Osaka", "Hiroshima"],
      "Tokyo",
      "Hiroshima"
    );
    expect(order[0]).toBe("Tokyo");
    expect(order[order.length - 1]).toBe("Hiroshima");
    // middle progresses geographically, no backtracking
    expect(order).toEqual(["Tokyo", "Kyoto", "Osaka", "Hiroshima"]);
  });

  it("reverses direction when the end is north of the start", () => {
    const order = orderRegions(["Tokyo", "Kyoto", "Osaka"], "Osaka", "Tokyo");
    expect(order).toEqual(["Osaka", "Kyoto", "Tokyo"]);
  });

  it("picks up regions behind the start before moving forward", () => {
    // Start in Kyoto, end in Hiroshima (south). Tokyo is north/behind the start.
    const order = orderRegions(["Tokyo", "Kyoto", "Hiroshima"], "Kyoto", "Hiroshima");
    expect(order[0]).toBe("Kyoto");
    expect(order[order.length - 1]).toBe("Hiroshima");
    expect(order.indexOf("Tokyo" as Region)).toBe(1); // behind the start, visited first
  });
});

describe("buildItinerary", () => {
  it("creates one Day per date in the inclusive range", () => {
    const days = buildItinerary([p("a", "Tokyo")], new Date("2026-04-01"), new Date("2026-04-03"));
    expect(days).toHaveLength(3);
    expect(days.map((d) => d.dayIndex)).toEqual([0, 1, 2]);
  });

  it("keeps places from the same region contiguous", () => {
    const places = [p("t1", "Tokyo"), p("k1", "Kyoto"), p("t2", "Tokyo"), p("k2", "Kyoto")];
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-02"));
    expect(days.flatMap((d) => d.places).map((x) => x.id)).toEqual(["t1", "t2", "k1", "k2"]);
  });

  it("packs a day up to the available hours, not a flat count", () => {
    // Four 3h places = 12h; only three (9h) fit on day 1, the fourth spills to day 2.
    const places = Array.from({ length: 4 }, (_, i) => p("x" + i, "Tokyo", "", 3));
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-02"));
    expect(days[0].places).toHaveLength(3);
    expect(days[1].places).toHaveLength(1);
  });

  it("starts a new day when the region changes, even if hours would still fit", () => {
    // Two short Tokyo places (3h) then one short Kyoto place; all three fit in 9h,
    // but the region change should push Kyoto to its own day.
    const places = [p("t1", "Tokyo", "", 3), p("t2", "Tokyo", "", 3), p("k1", "Kyoto", "", 3)];
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-03"));
    expect(days[0].places.map((x) => x.id)).toEqual(["t1", "t2"]);
    expect(days[1].places.map((x) => x.id)).toEqual(["k1"]);
  });

  it("gives a full-day place a day to itself", () => {
    const places = [p("morning", "Tokyo", "", 3), p("bigpark", "Tokyo", "", DAY_HOURS)];
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-02"));
    expect(days[0].places.map((x) => x.id)).toEqual(["morning"]);
    expect(days[1].places.map((x) => x.id)).toEqual(["bigpark"]);
  });

  it("spreads a multi-day place across the allocated number of days", () => {
    const places = [p("usj", "Osaka", "Osaka", DAY_HOURS, 2)];
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-02"), {
      dayAllocations: { usj: 2 },
    });
    expect(days[0].places.map((x) => x.id)).toEqual(["usj"]);
    expect(days[1].places.map((x) => x.id)).toEqual(["usj"]);
  });

  it("overflows remaining places onto the last day when out of days", () => {
    const places = Array.from({ length: 6 }, (_, i) => p("x" + i, "Tokyo", "", 3));
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-01"));
    expect(days).toHaveLength(1);
    expect(days[0].places).toHaveLength(6);
  });

  it("assigns every selected place exactly once", () => {
    const places = [p("t1", "Tokyo"), p("k1", "Kyoto"), p("o1", "Osaka")];
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-03"));
    expect(days.flatMap((d) => d.places)).toHaveLength(3);
  });

  it("pulls the startCity's places to the front", () => {
    const places = [p("t1", "Tokyo", "Tokyo"), p("k1", "Kyoto", "Kyoto"), p("o1", "Osaka", "Osaka")];
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-03"), { startCity: "Osaka" });
    expect(days.flatMap((d) => d.places).map((x) => x.id)[0]).toBe("o1");
  });

  it("pushes the endCity's places to the back", () => {
    const places = [p("t1", "Tokyo", "Tokyo"), p("k1", "Kyoto", "Kyoto"), p("o1", "Osaka", "Osaka")];
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-03"), { endCity: "Tokyo" });
    const ids = days.flatMap((d) => d.places).map((x) => x.id);
    expect(ids[ids.length - 1]).toBe("t1");
  });
});
