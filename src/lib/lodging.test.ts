import { describe, it, expect } from "vitest";
import {
  haversineKm,
  toISODate,
  groupStays,
  recommendForStay,
  recommendStays,
  bookingLinksForArea,
} from "@/lib/lodging";
import { LODGING_AREAS } from "@/data/lodging";
import { PLACES } from "@/data/places";
import type { Day } from "@/lib/itinerary";
import type { Place } from "@/data/places";

const place = (id: string, region: Place["region"], lat = 0, lng = 0): Place => ({
  id,
  name: id,
  city: "",
  region,
  category: "landmark",
  description: "",
  lat,
  lng,
  activities: [],
});

const day = (dayIndex: number, dateStr: string, places: Place[]): Day => ({
  dayIndex,
  date: new Date(dateStr),
  places,
});

// local helper mirroring toISODate for readable assertions
function toISODateLocal(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

describe("LODGING_AREAS data integrity", () => {
  it("has unique ids", () => {
    const ids = LODGING_AREAS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every region that has attractions", () => {
    const attractionRegions = new Set(PLACES.map((p) => p.region));
    const lodgingRegions = new Set(LODGING_AREAS.map((a) => a.region));
    for (const region of attractionRegions) {
      expect(lodgingRegions.has(region)).toBe(true);
    }
  });

  it("has valid coordinates for every area", () => {
    for (const a of LODGING_AREAS) {
      expect(Number.isFinite(a.lat)).toBe(true);
      expect(Number.isFinite(a.lng)).toBe(true);
    }
  });
});

describe("haversineKm", () => {
  it("returns ~0 for identical points", () => {
    expect(haversineKm(35, 139, 35, 139)).toBeCloseTo(0, 5);
  });

  it("approximates a known distance (Tokyo Station -> Osaka Station ~= 400km)", () => {
    const km = haversineKm(35.681, 139.767, 34.702, 135.495);
    expect(km).toBeGreaterThan(380);
    expect(km).toBeLessThan(420);
  });
});

describe("toISODate", () => {
  it("formats local Y-M-D with zero padding and no UTC shift", () => {
    expect(toISODate(new Date(2026, 6, 5))).toBe("2026-07-05");
  });
});

describe("groupStays", () => {
  it("returns [] for an empty itinerary", () => {
    expect(groupStays([])).toEqual([]);
  });

  it("makes one stay for a single region", () => {
    const days = [
      day(0, "2026-07-25", [place("a", "Osaka")]),
      day(1, "2026-07-26", [place("b", "Osaka")]),
    ];
    const stays = groupStays(days);
    expect(stays).toHaveLength(1);
    expect(stays[0].region).toBe("Osaka");
    expect(stays[0].dayIndexes).toEqual([0, 1]);
    expect(stays[0].places.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("splits stays when the region changes and sets nights/checkIn/checkOut", () => {
    const days = [
      day(0, "2026-07-25", [place("o1", "Osaka")]),
      day(1, "2026-07-26", [place("o2", "Osaka")]),
      day(2, "2026-07-27", [place("k1", "Kyoto")]),
    ];
    const stays = groupStays(days);
    expect(stays).toHaveLength(2);

    expect(stays[0].region).toBe("Osaka");
    expect(stays[0].nights).toBe(2);
    expect(toISODateLocal(stays[0].checkIn)).toBe("2026-07-25");
    expect(toISODateLocal(stays[0].checkOut)).toBe("2026-07-27"); // next region's start

    expect(stays[1].region).toBe("Kyoto");
    expect(stays[1].nights).toBe(1);
    expect(toISODateLocal(stays[1].checkIn)).toBe("2026-07-27");
    expect(toISODateLocal(stays[1].checkOut)).toBe("2026-07-28"); // final stay: last day + 1
  });

  it("absorbs empty-place days into the current stay", () => {
    const days = [
      day(0, "2026-07-25", [place("o1", "Osaka")]),
      day(1, "2026-07-26", []),
      day(2, "2026-07-27", [place("o2", "Osaka")]),
    ];
    const stays = groupStays(days);
    expect(stays).toHaveLength(1);
    expect(stays[0].dayIndexes).toEqual([0, 1, 2]);
  });

  it("keeps a repeated multi-day place in one stay", () => {
    const usj = place("usj", "Osaka");
    const days = [day(0, "2026-07-25", [usj]), day(1, "2026-07-26", [usj])];
    const stays = groupStays(days);
    expect(stays).toHaveLength(1);
    expect(stays[0].nights).toBe(2);
  });
});

// Osaka areas from the dataset: Namba (34.6659,135.5012), Umeda (34.7025,135.4959),
// Tennoji (34.6465,135.5136).
describe("recommendForStay", () => {
  it("ranks the nearest area first by mean distance to attractions", () => {
    const stay = {
      region: "Osaka" as const,
      dayIndexes: [0],
      nights: 1,
      checkIn: new Date(2026, 6, 25),
      checkOut: new Date(2026, 6, 26),
      places: [place("north", "Osaka", 34.705, 135.496)], // near Umeda
    };
    const areas = recommendForStay(stay, 3);
    expect(areas[0].id).toBe("osaka-umeda");
    expect(areas).toHaveLength(3);
  });

  it("changes the top pick when attractions move south", () => {
    const stay = {
      region: "Osaka" as const,
      dayIndexes: [0],
      nights: 1,
      checkIn: new Date(2026, 6, 25),
      checkOut: new Date(2026, 6, 26),
      places: [place("south", "Osaka", 34.647, 135.513)], // near Tennoji
    };
    expect(recommendForStay(stay, 1)[0].id).toBe("osaka-tennoji");
  });

  it("respects the limit", () => {
    const stay = {
      region: "Osaka" as const,
      dayIndexes: [0],
      nights: 1,
      checkIn: new Date(2026, 6, 25),
      checkOut: new Date(2026, 6, 26),
      places: [place("x", "Osaka", 34.67, 135.5)],
    };
    expect(recommendForStay(stay, 2)).toHaveLength(2);
  });

  it("falls back to declared order when no attraction has coordinates", () => {
    const stay = {
      region: "Osaka" as const,
      dayIndexes: [0],
      nights: 1,
      checkIn: new Date(2026, 6, 25),
      checkOut: new Date(2026, 6, 26),
      places: [], // no places -> no coords
    };
    const areas = recommendForStay(stay, 3);
    expect(areas.map((a) => a.id)).toEqual(["osaka-namba", "osaka-umeda", "osaka-tennoji"]);
  });
});

describe("recommendStays", () => {
  it("produces one recommendation per stay", () => {
    const days = [
      day(0, "2026-07-25", [place("o1", "Osaka", 34.67, 135.5)]),
      day(1, "2026-07-26", [place("k1", "Kyoto", 34.99, 135.76)]),
    ];
    const recs = recommendStays(days, 3);
    expect(recs).toHaveLength(2);
    expect(recs[0].stay.region).toBe("Osaka");
    expect(recs[0].areas.length).toBeGreaterThan(0);
  });
});

describe("bookingLinksForArea", () => {
  const namba = LODGING_AREAS.find((a) => a.id === "osaka-namba")!;
  const checkIn = new Date(2026, 6, 25); // 2026-07-25
  const checkOut = new Date(2026, 6, 29); // 2026-07-29

  it("returns Booking.com and Airbnb links", () => {
    const links = bookingLinksForArea(namba, checkIn, checkOut, 2);
    expect(links.map((l) => l.provider).sort()).toEqual(["airbnb", "booking"]);
  });

  it("Booking.com link carries dates, adults, and the encoded search term", () => {
    const booking = bookingLinksForArea(namba, checkIn, checkOut, 3).find(
      (l) => l.provider === "booking"
    )!;
    expect(booking.url).toContain("https://www.booking.com/searchresults.html?");
    expect(booking.url).toContain("checkin=2026-07-25");
    expect(booking.url).toContain("checkout=2026-07-29");
    expect(booking.url).toContain("group_adults=3");
    expect(booking.url).toContain(encodeURIComponent("Namba, Osaka, Japan"));
  });

  it("Airbnb link carries dates, adults, and encoded location in the path", () => {
    const airbnb = bookingLinksForArea(namba, checkIn, checkOut, 2).find(
      (l) => l.provider === "airbnb"
    )!;
    expect(airbnb.url).toContain("https://www.airbnb.com/s/");
    expect(airbnb.url).toContain("/homes?");
    expect(airbnb.url).toContain("checkin=2026-07-25");
    expect(airbnb.url).toContain("checkout=2026-07-29");
    expect(airbnb.url).toContain("adults=2");
    expect(airbnb.url).toContain(encodeURIComponent("Namba, Osaka, Japan"));
  });

  it("falls back to `${name}, Japan` when searchTerm is absent", () => {
    const area = { ...namba, searchTerm: undefined };
    const booking = bookingLinksForArea(area, checkIn, checkOut, 1).find(
      (l) => l.provider === "booking"
    )!;
    expect(booking.url).toContain(encodeURIComponent("Namba / Dotonbori, Japan"));
  });
});
