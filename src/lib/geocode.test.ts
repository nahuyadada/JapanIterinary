import { describe, it, expect } from "vitest";
import {
  GEOCODE_MAX_RESULTS,
  createTtlCache,
  geocoderUserAgent,
  normalizeQuery,
  nominatimSearchUrl,
  parseNominatimResults,
} from "@/lib/geocode";

/** One well-formed Nominatim jsonv2 row. Note lat/lon arrive as strings. */
const row = (over: Record<string, unknown> = {}) => ({
  name: "Hotel Gracery Shinjuku",
  display_name: "Hotel Gracery Shinjuku, 1-19-1 Kabukicho, Shinjuku, Tokyo, 160-8466, Japan",
  lat: "35.6955",
  lon: "139.7006",
  ...over,
});

describe("normalizeQuery", () => {
  it("trims and collapses inner whitespace", () => {
    expect(normalizeQuery("  Hotel   Gracery  ")).toBe("Hotel Gracery");
  });

  it("rejects a query that is too short once trimmed", () => {
    expect(normalizeQuery("ab")).toBeNull();
    expect(normalizeQuery("  a  ")).toBeNull();
  });

  it("rejects whitespace-only and empty input", () => {
    expect(normalizeQuery("")).toBeNull();
    expect(normalizeQuery("     ")).toBeNull();
    expect(normalizeQuery("\t\n")).toBeNull();
  });

  it("rejects non-string input", () => {
    expect(normalizeQuery(null)).toBeNull();
    expect(normalizeQuery(undefined)).toBeNull();
    expect(normalizeQuery(42)).toBeNull();
    expect(normalizeQuery({ q: "hotel" })).toBeNull();
  });

  it("caps an over-long query rather than rejecting it", () => {
    const long = "h".repeat(500);
    expect(normalizeQuery(long)).toHaveLength(120);
  });

  it("accepts a three-character query", () => {
    expect(normalizeQuery("ANA")).toBe("ANA");
  });

  it("preserves the typed casing — only the cache key is folded", () => {
    expect(normalizeQuery("HoTeL Okura")).toBe("HoTeL Okura");
  });
});

describe("nominatimSearchUrl", () => {
  it("targets the hard-coded Nominatim host with the documented parameters", () => {
    const url = new URL(nominatimSearchUrl("Hotel Gracery"));
    expect(url.origin).toBe("https://nominatim.openstreetmap.org");
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toBe("Hotel Gracery");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect(url.searchParams.get("countrycodes")).toBe("jp");
    expect(url.searchParams.get("limit")).toBe(String(GEOCODE_MAX_RESULTS));
    expect(url.searchParams.get("addressdetails")).toBe("1");
  });

  it("encodes the query into a parameter rather than the host, so there is no SSRF surface", () => {
    const url = new URL(nominatimSearchUrl("evil.example.com/?x=1 & #frag"));
    expect(url.origin).toBe("https://nominatim.openstreetmap.org");
    expect(url.searchParams.get("q")).toBe("evil.example.com/?x=1 & #frag");
  });
});

describe("geocoderUserAgent", () => {
  it("includes the configured contact", () => {
    expect(geocoderUserAgent("someone@example.com")).toContain("someone@example.com");
    expect(geocoderUserAgent("someone@example.com")).toContain("japan-itinerary-maker");
  });

  it("falls back to a generic repository identifier when unset or blank", () => {
    for (const value of [undefined, "", "   "]) {
      const ua = geocoderUserAgent(value);
      expect(ua).toContain("japan-itinerary-maker");
      expect(ua.length).toBeGreaterThan(20);
    }
  });

  it("strips newlines, which would let a bad value inject a header", () => {
    const ua = geocoderUserAgent("a@b.com\r\nX-Injected: yes");
    expect(ua).not.toContain("\n");
    expect(ua).not.toContain("\r");
  });
});

describe("parseNominatimResults", () => {
  it("normalizes a well-formed row, parsing the string coordinates", () => {
    expect(parseNominatimResults([row()])).toEqual([
      {
        name: "Hotel Gracery Shinjuku",
        address:
          "Hotel Gracery Shinjuku, 1-19-1 Kabukicho, Shinjuku, Tokyo, 160-8466, Japan",
        lat: 35.6955,
        lng: 139.7006,
      },
    ]);
  });

  it("falls back to the first segment of display_name when name is missing or blank", () => {
    expect(parseNominatimResults([row({ name: undefined })])[0].name).toBe(
      "Hotel Gracery Shinjuku"
    );
    expect(parseNominatimResults([row({ name: "  " })])[0].name).toBe("Hotel Gracery Shinjuku");
  });

  it("drops rows with unparseable or missing coordinates", () => {
    expect(parseNominatimResults([row({ lat: "not-a-number" })])).toEqual([]);
    expect(parseNominatimResults([row({ lat: undefined })])).toEqual([]);
    expect(parseNominatimResults([row({ lon: null })])).toEqual([]);
    expect(parseNominatimResults([row({ lat: "", lon: "" })])).toEqual([]);
  });

  it("drops rows whose coordinates are out of range", () => {
    expect(parseNominatimResults([row({ lat: "91" })])).toEqual([]);
    expect(parseNominatimResults([row({ lon: "181" })])).toEqual([]);
  });

  it("accepts numeric coordinates too, since jsonv2 is not contractually string-typed", () => {
    const parsed = parseNominatimResults([row({ lat: 35.5, lon: 139.5 })]);
    expect(parsed[0]).toMatchObject({ lat: 35.5, lng: 139.5 });
  });

  it("drops a row with no usable name at all", () => {
    expect(parseNominatimResults([row({ name: undefined, display_name: undefined })])).toEqual([]);
    expect(parseNominatimResults([row({ name: "", display_name: "" })])).toEqual([]);
  });

  it("returns an empty list for an empty array", () => {
    expect(parseNominatimResults([])).toEqual([]);
  });

  it("returns an empty list for anything that is not an array", () => {
    for (const bad of [null, undefined, "nope", 7, {}, { results: [] }]) {
      expect(parseNominatimResults(bad)).toEqual([]);
    }
  });

  it("skips non-object entries instead of failing the whole response", () => {
    expect(parseNominatimResults(["x", null, row()])).toHaveLength(1);
  });

  it("caps the number of results", () => {
    const many = Array.from({ length: 25 }, () => row());
    expect(parseNominatimResults(many)).toHaveLength(GEOCODE_MAX_RESULTS);
  });

  it("caps over-long names and addresses so a hostile upstream cannot bloat the payload", () => {
    const parsed = parseNominatimResults([
      row({ name: "n".repeat(400), display_name: "d".repeat(900) }),
    ]);
    expect(parsed[0].name.length).toBeLessThanOrEqual(120);
    expect(parsed[0].address.length).toBeLessThanOrEqual(200);
  });
});

describe("createTtlCache", () => {
  it("returns a stored value before the TTL expires", () => {
    let now = 1_000;
    const cache = createTtlCache<string>(5_000, () => now);
    cache.set("kyoto", "hit");
    now = 4_999;
    expect(cache.get("kyoto")).toBe("hit");
  });

  it("drops a value once the TTL has passed", () => {
    let now = 1_000;
    const cache = createTtlCache<string>(5_000, () => now);
    cache.set("kyoto", "hit");
    now = 6_001;
    expect(cache.get("kyoto")).toBeUndefined();
  });

  it("misses on an unknown key", () => {
    const cache = createTtlCache<string>(5_000, () => 0);
    expect(cache.get("nothing")).toBeUndefined();
  });

  it("folds case and whitespace so equivalent queries share one entry", () => {
    const cache = createTtlCache<string>(5_000, () => 0);
    cache.set("Hotel  Okura", "hit");
    expect(cache.get("hotel okura")).toBe("hit");
    expect(cache.get("  HOTEL OKURA  ")).toBe("hit");
  });

  it("evicts the oldest entry once the size limit is reached, so it cannot grow forever", () => {
    let now = 0;
    const cache = createTtlCache<string>(5_000, () => now, 2);
    cache.set("a", "1");
    now = 1;
    cache.set("b", "2");
    now = 2;
    cache.set("c", "3");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
  });
});
