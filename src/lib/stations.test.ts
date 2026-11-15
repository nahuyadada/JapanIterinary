import { describe, it, expect } from "vitest";
import {
  STATION_MAX_POINTS,
  parsePhotonStation,
  parseStationPoints,
  photonStationUrl,
  pointKey,
} from "@/lib/stations";

describe("parseStationPoints", () => {
  it("reads a list of lat,lng pairs", () => {
    expect(parseStationPoints("34.6695,135.4985;34.6525,135.5063")).toEqual([
      { lat: 34.6695, lng: 135.4985 },
      { lat: 34.6525, lng: 135.5063 },
    ]);
  });

  it("rejects anything that is not a clean list of coordinates", () => {
    expect(parseStationPoints(null)).toBeNull();
    expect(parseStationPoints("")).toBeNull();
    expect(parseStationPoints("34.6,")).toBeNull();
    expect(parseStationPoints("abc,135")).toBeNull();
    expect(parseStationPoints("95,135")).toBeNull();
    expect(parseStationPoints("34,135,7")).toBeNull();
  });

  it("rejects more points than a day can reasonably hold", () => {
    const tooMany = Array.from({ length: STATION_MAX_POINTS + 1 }, () => "34.6,135.5").join(";");
    expect(parseStationPoints(tooMany)).toBeNull();
  });
});

describe("photonStationUrl", () => {
  it("asks for the single nearest railway station", () => {
    const url = new URL(photonStationUrl({ lat: 34.6695, lng: 135.4985 }));
    expect(url.origin + url.pathname).toBe("https://photon.komoot.io/reverse");
    expect(url.searchParams.get("lat")).toBe("34.6695");
    expect(url.searchParams.get("lon")).toBe("135.4985");
    expect(url.searchParams.get("osm_tag")).toBe("railway:station");
    expect(url.searchParams.get("limit")).toBe("1");
  });
});

describe("parsePhotonStation", () => {
  it("returns the first feature with a name and coordinates", () => {
    const station = parsePhotonStation({
      features: [
        { properties: {}, geometry: { coordinates: [135.5, 34.66] } },
        { properties: { name: " Namba " }, geometry: { coordinates: [135.5013, 34.6664] } },
      ],
    });
    expect(station).toEqual({ name: "Namba", lat: 34.6664, lng: 135.5013 });
  });

  it("returns null when nothing usable came back", () => {
    expect(parsePhotonStation(null)).toBeNull();
    expect(parsePhotonStation({ features: [] })).toBeNull();
    expect(parsePhotonStation({ features: [{ properties: { name: "X" }, geometry: {} }] })).toBeNull();
  });
});

describe("pointKey", () => {
  it("groups points within about a hundred metres", () => {
    expect(pointKey({ lat: 34.67024, lng: 135.49826 })).toBe(pointKey({ lat: 34.6702, lng: 135.4983 }));
  });
});
