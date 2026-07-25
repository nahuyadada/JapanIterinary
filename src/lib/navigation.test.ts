import { describe, it, expect } from "vitest";
import {
  directionsUrl,
  buildDayRoutes,
  hasCoords,
  type NavPoint,
  type TextPoint,
} from "@/lib/navigation";
import type { Day } from "@/lib/itinerary";
import type { Place } from "@/data/places";
import type { StayRecommendation } from "@/lib/lodging";
import type { LodgingArea } from "@/data/lodging";

const place = (id: string, lat: number, lng: number): Place => ({
  id,
  name: id,
  city: "",
  region: "Osaka",
  category: "landmark",
  description: "",
  lat,
  lng,
  activities: [],
});

const day = (dayIndex: number, places: Place[]): Day => ({
  dayIndex,
  date: new Date(2026, 6, 25 + dayIndex),
  places,
});

const area = (id: string, name: string, lat: number, lng: number): LodgingArea => ({
  id,
  name,
  region: "Osaka",
  lat,
  lng,
  blurb: "",
  goodFor: "",
});

describe("directionsUrl", () => {
  const from: NavPoint = { name: "Hotel", lat: 34.6659, lng: 135.5012 };
  const to: NavPoint = { name: "USJ", lat: 34.6654, lng: 135.4323 };

  it("builds a Google Maps directions link with origin, destination, and mode", () => {
    const url = directionsUrl(from, to, "transit");
    expect(url).toContain("https://www.google.com/maps/dir/?api=1");
    expect(url).toContain(`origin=${encodeURIComponent("34.6659,135.5012")}`);
    expect(url).toContain(`destination=${encodeURIComponent("34.6654,135.4323")}`);
    expect(url).toContain("travelmode=transit");
  });

  it("respects the chosen mode", () => {
    expect(directionsUrl(from, to, "walking")).toContain("travelmode=walking");
    expect(directionsUrl(from, to, "driving")).toContain("travelmode=driving");
  });

  it("uses the raw text when the origin is a typed hotel with no coordinates", () => {
    const hotel: TextPoint = { name: "Hotel Example", query: "Hotel Example, Osaka" };
    const url = directionsUrl(hotel, to, "transit");
    expect(url).toContain(`origin=${encodeURIComponent("Hotel Example, Osaka")}`);
    expect(url).toContain(`destination=${encodeURIComponent("34.6654,135.4323")}`);
    // The display name must not leak into the link when a fuller query was supplied.
    expect(url).not.toContain("origin=Hotel+Example&");
  });
});

describe("hasCoords", () => {
  it("separates coordinate points from text-only points", () => {
    expect(hasCoords({ name: "USJ", lat: 34.66, lng: 135.43 })).toBe(true);
    expect(hasCoords({ name: "Hotel Example", query: "Hotel Example" })).toBe(false);
  });
});

describe("buildDayRoutes", () => {
  const stay = (dayIndexes: number[], top: LodgingArea): StayRecommendation => ({
    stay: {
      region: "Osaka",
      dayIndexes,
      nights: dayIndexes.length,
      checkIn: new Date(2026, 6, 25),
      checkOut: new Date(2026, 6, 26),
      places: [],
    },
    areas: [top],
  });

  it("starts each day from the accommodation, then chains destinations", () => {
    const days = [day(0, [place("usj", 34.6654, 135.4323), place("dotonbori", 34.6687, 135.5013)])];
    const recs = [stay([0], area("osaka-namba", "Namba / Dotonbori", 34.6659, 135.5012))];
    const routes = buildDayRoutes(days, recs);

    expect(routes).toHaveLength(1);
    const legs = routes[0].legs;
    expect(legs).toHaveLength(2);
    expect(legs[0].from.name).toBe("Namba / Dotonbori");
    expect(legs[0].to.name).toBe("usj");
    expect(legs[1].from.name).toBe("usj");
    expect(legs[1].to.name).toBe("dotonbori");
    expect(legs[0].straightLineKm).toBeGreaterThan(0);
  });

  it("falls back to starting from the first place when no accommodation is known", () => {
    const days = [day(0, [place("a", 34.66, 135.5), place("b", 34.67, 135.51)])];
    const routes = buildDayRoutes(days, []);
    expect(routes[0].legs).toHaveLength(1);
    expect(routes[0].legs[0].from.name).toBe("a");
    expect(routes[0].legs[0].to.name).toBe("b");
  });

  it("produces no legs for an empty day", () => {
    const routes = buildDayRoutes([day(0, [])], []);
    expect(routes[0].legs).toEqual([]);
  });

  it("produces a single accommodation->place leg for a one-place day", () => {
    const days = [day(0, [place("usj", 34.6654, 135.4323)])];
    const recs = [stay([0], area("osaka-namba", "Namba", 34.6659, 135.5012))];
    const routes = buildDayRoutes(days, recs);
    expect(routes[0].legs).toHaveLength(1);
    expect(routes[0].legs[0].from.name).toBe("Namba");
    expect(routes[0].legs[0].to.name).toBe("usj");
  });
});
