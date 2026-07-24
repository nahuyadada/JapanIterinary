import { describe, it, expect } from "vitest";
import { buildItinerary, tripDays } from "./itinerary";
import type { Place } from "@/data/places";

const p = (id: string, region: Place["region"], city: string = ""): Place => ({
  id,
  name: id,
  city,
  region,
  category: "landmark",
  description: "",
  lat: 0,
  lng: 0,
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

  it("caps a day at 4 places and overflows to the last day when out of days", () => {
    const places = Array.from({ length: 6 }, (_, i) => p("x" + i, "Tokyo"));
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-01"));
    expect(days).toHaveLength(1);
    expect(days[0].places).toHaveLength(6);
  });

  it("leaves days empty when there are fewer places than days", () => {
    const days = buildItinerary([p("a", "Tokyo")], new Date("2026-04-01"), new Date("2026-04-03"));
    const nonEmpty = days.filter((d) => d.places.length > 0);
    expect(nonEmpty).toHaveLength(1);
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
