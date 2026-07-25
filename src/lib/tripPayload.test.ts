import { describe, it, expect } from "vitest";
import { PLACES } from "@/data/places";
import {
  buildPayload,
  decodePayload,
  encodePayload,
  parsePayload,
  payloadPlaces,
  payloadToItinerary,
  type TripPayload,
} from "@/lib/tripPayload";


const SENSOJI = "tokyo-sensoji";
const MEIJI = "tokyo-meiji";
const FUSHIMI = "kyoto-fushimi";

/** A minimal valid payload; spread over it to vary one field at a time. */
function payload(overrides: Partial<TripPayload> = {}): TripPayload {
  return {
    v: 1,
    selectedIds: [SENSOJI, MEIJI],
    start: "2026-04-01",
    end: "2026-04-03",
    manualMoves: {},
    dayAllocations: {},
    adults: 2,
    transportMode: "transit",
    stayOrigins: {},
    ...overrides,
  };
}

describe("catalog assumptions", () => {
  it("still contains the ids these tests rely on", () => {
    const known = new Set(PLACES.map((p) => p.id));
    for (const id of [SENSOJI, MEIJI, FUSHIMI]) expect(known.has(id)).toBe(true);
  });
});

describe("buildPayload", () => {
  it("stamps the schema version", () => {
    expect(buildPayload(payload()).v).toBe(1);
  });

  it("carries the wizard's inputs through unchanged", () => {
    const built = buildPayload({
      selectedIds: [SENSOJI],
      start: "2026-04-01",
      end: "2026-04-05",
      startCity: "Tokyo",
      endCity: "Kyoto",
      manualMoves: { [SENSOJI]: 2 },
      dayAllocations: { [SENSOJI]: 1 },
      adults: 3,
      transportMode: "walking",
      stayOrigins: { "Tokyo-0": { name: "Hotel Example" } },
    });
    expect(built).toEqual({
      v: 1,
      selectedIds: [SENSOJI],
      start: "2026-04-01",
      end: "2026-04-05",
      startCity: "Tokyo",
      endCity: "Kyoto",
      manualMoves: { [SENSOJI]: 2 },
      dayAllocations: { [SENSOJI]: 1 },
      adults: 3,
      transportMode: "walking",
      stayOrigins: { "Tokyo-0": { name: "Hotel Example" } },
    });
  });

  it("omits blank city preferences instead of storing empty strings", () => {
    const built = buildPayload({ ...payload(), startCity: "", endCity: "" });
    expect("startCity" in built).toBe(false);
    expect("endCity" in built).toBe(false);
  });

  it("round-trips through parsePayload", () => {
    const built = buildPayload(payload({ startCity: "Tokyo" }));
    expect(parsePayload(JSON.parse(JSON.stringify(built)))).toEqual(built);
  });
});

describe("parsePayload", () => {
  it("accepts a well-formed payload", () => {
    expect(parsePayload(payload())).toEqual(payload());
  });

  it("rejects values that are not objects", () => {
    for (const bad of [null, undefined, 42, "x", true, [payload()]]) {
      expect(parsePayload(bad)).toBeNull();
    }
  });

  it("rejects an unrecognised schema version rather than guessing", () => {
    expect(parsePayload({ ...payload(), v: 2 })).toBeNull();
    expect(parsePayload({ ...payload(), v: "1" })).toBeNull();
    const noVersion: Record<string, unknown> = { ...payload() };
    delete noVersion.v;
    expect(parsePayload(noVersion)).toBeNull();
  });

  it("rejects malformed dates", () => {
    for (const start of ["2026-4-1", "01/04/2026", "2026-04-01T00:00:00Z", "", 20260401]) {
      expect(parsePayload({ ...payload(), start })).toBeNull();
    }
    expect(parsePayload({ ...payload(), end: "nope" })).toBeNull();
  });

  it("rejects a trip that ends before it starts", () => {
    expect(parsePayload({ ...payload(), start: "2026-04-05", end: "2026-04-01" })).toBeNull();
  });

  it("accepts a single-day trip", () => {
    const same = parsePayload({ ...payload(), start: "2026-04-01", end: "2026-04-01" });
    expect(same?.start).toBe("2026-04-01");
    expect(same?.end).toBe("2026-04-01");
  });

  it("drops place ids that are not in the catalog", () => {
    const parsed = parsePayload({
      ...payload(),
      selectedIds: [SENSOJI, "not-a-real-place", "../../etc/passwd", 7, null, MEIJI],
    });
    expect(parsed?.selectedIds).toEqual([SENSOJI, MEIJI]);
  });

  it("rejects a payload with no surviving places", () => {
    expect(parsePayload({ ...payload(), selectedIds: ["nope", "also-nope"] })).toBeNull();
    expect(parsePayload({ ...payload(), selectedIds: [] })).toBeNull();
    expect(parsePayload({ ...payload(), selectedIds: "not-an-array" })).toBeNull();
  });

  it("de-duplicates place ids", () => {
    const parsed = parsePayload({ ...payload(), selectedIds: [SENSOJI, SENSOJI, MEIJI, SENSOJI] });
    expect(parsed?.selectedIds).toEqual([SENSOJI, MEIJI]);
  });

  it("caps how many places one payload can carry", () => {
    const parsed = parsePayload({
      ...payload(),
      // Every catalog id repeated: de-duplication brings this under the cap, so the
      // result is bounded by the catalog rather than by the attacker's array length.
      selectedIds: [...PLACES.map((p) => p.id), ...PLACES.map((p) => p.id)],
    });
    expect(parsed!.selectedIds.length).toBeLessThanOrEqual(200);
    expect(parsed!.selectedIds.length).toBe(PLACES.length);
  });

  it("falls back to transit for an unknown transport mode", () => {
    expect(parsePayload({ ...payload(), transportMode: "teleport" })?.transportMode).toBe("transit");
    expect(parsePayload({ ...payload(), transportMode: undefined })?.transportMode).toBe("transit");
    expect(parsePayload({ ...payload(), transportMode: "driving" })?.transportMode).toBe("driving");
  });

  it("clamps the traveler count into a sane range", () => {
    expect(parsePayload({ ...payload(), adults: 0 })?.adults).toBe(1);
    expect(parsePayload({ ...payload(), adults: -5 })?.adults).toBe(1);
    expect(parsePayload({ ...payload(), adults: 999 })?.adults).toBe(8);
    expect(parsePayload({ ...payload(), adults: 3.7 })?.adults).toBe(3);
    expect(parsePayload({ ...payload(), adults: "4" })?.adults).toBe(2);
    expect(parsePayload({ ...payload(), adults: NaN })?.adults).toBe(2);
  });

  it("keeps only numeric entries in the number maps", () => {
    const parsed = parsePayload({
      ...payload(),
      manualMoves: { [SENSOJI]: 2, bad: "3", worse: null, alsoBad: NaN, [MEIJI]: 1.9 },
      dayAllocations: { [SENSOJI]: 2 },
    });
    expect(parsed?.manualMoves).toEqual({ [SENSOJI]: 2, [MEIJI]: 1 });
    expect(parsed?.dayAllocations).toEqual({ [SENSOJI]: 2 });
  });

  it("defaults the maps to empty when they are the wrong shape", () => {
    const parsed = parsePayload({ ...payload(), manualMoves: "x", dayAllocations: [1, 2] });
    expect(parsed?.manualMoves).toEqual({});
    expect(parsed?.dayAllocations).toEqual({});
  });

  it("migrates a legacy bare-string stay origin to a name-only accommodation", () => {
    const parsed = parsePayload({
      ...payload(),
      stayOrigins: {
        "Tokyo-0": "  Hotel Example  ",
        "Kyoto-3": "   ",
        "Osaka-5": 42,
        "Nara-7": "x".repeat(500),
      },
    });
    expect(parsed?.stayOrigins["Tokyo-0"]).toEqual({ name: "Hotel Example" });
    expect("Kyoto-3" in parsed!.stayOrigins).toBe(false);
    expect("Osaka-5" in parsed!.stayOrigins).toBe(false);
    expect(parsed?.stayOrigins["Nara-7"].name).toHaveLength(120);
  });

  it("keeps a fully resolved accommodation", () => {
    const lodging = {
      name: "Hotel Gracery",
      lat: 35.6955,
      lng: 139.7006,
      address: "1-19-1 Kabukicho, Shinjuku, Tokyo",
      source: "geocoded",
    };
    const parsed = parsePayload({ ...payload(), stayOrigins: { "Tokyo-0": lodging } });
    expect(parsed?.stayOrigins["Tokyo-0"]).toEqual(lodging);
  });

  it("drops an accommodation object with no usable name", () => {
    const parsed = parsePayload({
      ...payload(),
      stayOrigins: {
        "Tokyo-0": { lat: 35.6, lng: 139.7 },
        "Kyoto-3": { name: "   ", lat: 35, lng: 135 },
        "Osaka-5": { name: 42 },
        "Nara-7": null,
        "Kobe-9": [],
      },
    });
    expect(parsed?.stayOrigins).toEqual({});
  });

  it("drops both coordinates when either is out of range", () => {
    const parsed = parsePayload({
      ...payload(),
      stayOrigins: {
        "Tokyo-0": { name: "Too far north", lat: 91, lng: 139.7, source: "pinned" },
        "Kyoto-3": { name: "Too far east", lat: 35, lng: 181, source: "pinned" },
      },
    });
    expect(parsed?.stayOrigins["Tokyo-0"]).toEqual({ name: "Too far north" });
    expect(parsed?.stayOrigins["Kyoto-3"]).toEqual({ name: "Too far east" });
  });

  it("never keeps half a coordinate pair", () => {
    const parsed = parsePayload({
      ...payload(),
      stayOrigins: {
        "Tokyo-0": { name: "Lat only", lat: 35.6 },
        "Kyoto-3": { name: "Lng only", lng: 139.7 },
        "Osaka-5": { name: "Not numbers", lat: "35.6", lng: "139.7" },
        "Nara-7": { name: "Not finite", lat: NaN, lng: Infinity },
      },
    });
    for (const key of ["Tokyo-0", "Kyoto-3", "Osaka-5", "Nara-7"]) {
      expect(parsed?.stayOrigins[key].lat).toBeUndefined();
      expect(parsed?.stayOrigins[key].lng).toBeUndefined();
    }
  });

  it("keeps source only when it is one of the two known values", () => {
    const parsed = parsePayload({
      ...payload(),
      stayOrigins: {
        "Tokyo-0": { name: "A", lat: 35, lng: 139, source: "geocoded" },
        "Kyoto-3": { name: "B", lat: 35, lng: 135, source: "pinned" },
        "Osaka-5": { name: "C", lat: 34, lng: 135, source: "trustworthy" },
        "Nara-7": { name: "D", lat: 34, lng: 135, source: 1 },
      },
    });
    expect(parsed?.stayOrigins["Tokyo-0"].source).toBe("geocoded");
    expect(parsed?.stayOrigins["Kyoto-3"].source).toBe("pinned");
    expect(parsed?.stayOrigins["Osaka-5"].source).toBeUndefined();
    expect(parsed?.stayOrigins["Nara-7"].source).toBeUndefined();
  });

  it("drops source when there are no coordinates for it to describe", () => {
    const parsed = parsePayload({
      ...payload(),
      stayOrigins: { "Tokyo-0": { name: "Name only", source: "geocoded" } },
    });
    expect(parsed?.stayOrigins["Tokyo-0"]).toEqual({ name: "Name only" });
  });

  it("caps the address and drops a blank one", () => {
    const parsed = parsePayload({
      ...payload(),
      stayOrigins: {
        "Tokyo-0": { name: "A", address: "a".repeat(900) },
        "Kyoto-3": { name: "B", address: "   " },
        "Osaka-5": { name: "C", address: 7 },
      },
    });
    expect(parsed?.stayOrigins["Tokyo-0"].address).toHaveLength(200);
    expect(parsed?.stayOrigins["Kyoto-3"].address).toBeUndefined();
    expect(parsed?.stayOrigins["Osaka-5"].address).toBeUndefined();
  });

  it("caps the number of stays", () => {
    const many: Record<string, unknown> = {};
    for (let i = 0; i < 100; i++) many[`Tokyo-${i}`] = { name: `Hotel ${i}` };
    const parsed = parsePayload({ ...payload(), stayOrigins: many });
    expect(Object.keys(parsed!.stayOrigins)).toHaveLength(40);
  });

  it("defaults stay origins to empty when the map is the wrong shape", () => {
    expect(parsePayload({ ...payload(), stayOrigins: "Hotel" })?.stayOrigins).toEqual({});
    expect(parsePayload({ ...payload(), stayOrigins: [1, 2] })?.stayOrigins).toEqual({});
    expect(parsePayload({ ...payload(), stayOrigins: undefined })?.stayOrigins).toEqual({});
  });

  it("ignores city preferences that are not non-empty strings", () => {
    const parsed = parsePayload({ ...payload(), startCity: "", endCity: 5 });
    expect("startCity" in parsed!).toBe(false);
    expect("endCity" in parsed!).toBe(false);
  });

  it("keeps city preferences that are usable", () => {
    const parsed = parsePayload({ ...payload(), startCity: "Tokyo", endCity: "Kyoto" });
    expect(parsed?.startCity).toBe("Tokyo");
    expect(parsed?.endCity).toBe("Kyoto");
  });

  it("does not copy unexpected keys onto the result", () => {
    const parsed = parsePayload({ ...payload(), evil: "payload" });
    expect("evil" in parsed!).toBe(false);
    expect(Object.keys(parsed!).sort()).toEqual(
      [
        "adults",
        "dayAllocations",
        "end",
        "manualMoves",
        "selectedIds",
        "start",
        "stayOrigins",
        "transportMode",
        "v",
      ].sort()
    );
  });
});

describe("payloadPlaces", () => {
  it("resolves ids to catalog places in catalog order", () => {
    const places = payloadPlaces(payload({ selectedIds: [MEIJI, SENSOJI] }));
    const order = PLACES.filter((p) => p.id === MEIJI || p.id === SENSOJI).map((p) => p.id);
    expect(places.map((p) => p.id)).toEqual(order);
  });

  it("returns nothing for ids that are not in the catalog", () => {
    expect(payloadPlaces(payload({ selectedIds: ["nope"] }))).toEqual([]);
  });
});

describe("payloadToItinerary", () => {
  it("builds one day per calendar day of the trip", () => {
    const days = payloadToItinerary(payload({ start: "2026-04-01", end: "2026-04-03" }));
    expect(days).toHaveLength(3);
    expect(days.map((d) => d.dayIndex)).toEqual([0, 1, 2]);
  });

  it("places every selected place somewhere", () => {
    const days = payloadToItinerary(payload({ selectedIds: [SENSOJI, MEIJI, FUSHIMI] }));
    const placed = days.flatMap((d) => d.places.map((p) => p.id));
    expect(new Set(placed)).toEqual(new Set([SENSOJI, MEIJI, FUSHIMI]));
  });

  it("honours a manual move to another day", () => {
    const days = payloadToItinerary(
      payload({ selectedIds: [SENSOJI, MEIJI], manualMoves: { [SENSOJI]: 2 } })
    );
    expect(days[2].places.map((p) => p.id)).toContain(SENSOJI);
    expect(days.flatMap((d) => d.places).filter((p) => p.id === SENSOJI)).toHaveLength(1);
  });

  it("clamps an out-of-range move onto a real day instead of crashing", () => {
    const high = payloadToItinerary(payload({ manualMoves: { [SENSOJI]: 99 } }));
    expect(high[high.length - 1].places.map((p) => p.id)).toContain(SENSOJI);

    const low = payloadToItinerary(payload({ manualMoves: { [SENSOJI]: -4 } }));
    expect(low[0].places.map((p) => p.id)).toContain(SENSOJI);
  });

  it("ignores moves for places that are not in the trip", () => {
    const days = payloadToItinerary(payload({ manualMoves: { "kyoto-gion": 1 } }));
    const placed = days.flatMap((d) => d.places.map((p) => p.id));
    expect(placed).not.toContain("kyoto-gion");
    expect(new Set(placed)).toEqual(new Set([SENSOJI, MEIJI]));
  });

  it("dates the days from the trip start, in local time", () => {
    const days = payloadToItinerary(payload({ start: "2026-04-01", end: "2026-04-02" }));
    expect(days[0].date.getFullYear()).toBe(2026);
    expect(days[0].date.getMonth()).toBe(3);
    expect(days[0].date.getDate()).toBe(1);
    expect(days[1].date.getDate()).toBe(2);
  });

  it("is deterministic, so a shared link does not drift between renders", () => {
    const p = payload({ selectedIds: [SENSOJI, MEIJI, FUSHIMI], end: "2026-04-05" });
    const a = payloadToItinerary(p);
    const b = payloadToItinerary(p);
    expect(a.map((d) => d.places.map((x) => x.id))).toEqual(
      b.map((d) => d.places.map((x) => x.id))
    );
  });
  it("carries customPlaces through parsePayload and payloadPlaces", () => {
    const customPlace = {
      id: "custom-123",
      name: "Ichiran Ramen",
      city: "Asakusa, Tokyo",
      region: "Tokyo" as const,
      category: "food" as const,
      description: "Ramen shop",
      lat: NaN,
      lng: NaN,
      durationHours: 1,
      customTime: "13:30",
      isCustom: true,
      activities: [],
    };
    const p = buildPayload({
      selectedIds: [SENSOJI, "custom-123"],
      start: "2026-04-01",
      end: "2026-04-02",
      manualMoves: {},
      dayAllocations: {},
      adults: 2,
      transportMode: "transit",
      stayOrigins: {},
      customPlaces: [customPlace],
    });
    const parsed = parsePayload(p);
    expect(parsed).not.toBeNull();
    expect(parsed?.customPlaces).toHaveLength(1);
    expect(parsed?.customPlaces?.[0].name).toBe("Ichiran Ramen");

    if (parsed) {
      const places = payloadPlaces(parsed);
      expect(places).toHaveLength(2);
      expect(places.map((x) => x.name)).toContain("Ichiran Ramen");
    }
  });
});

describe("encodePayload & decodePayload", () => {
  it("encodes and decodes a payload without loss", () => {
    const original = payload({ startCity: "Tokyo", endCity: "Kyoto", manualMoves: { [SENSOJI]: 1 } });
    const encoded = encodePayload(original);
    expect(typeof encoded).toBe("string");
    const decoded = decodePayload(encoded);
    expect(decoded).toEqual(original);
  });

  it("returns null for malformed or un-decodable strings", () => {
    expect(decodePayload("")).toBeNull();
    expect(decodePayload("garbage_string")).toBeNull();
  });

  // The compact format is the only share path when there is no database, so an
  // accommodation must survive it rather than silently vanishing.
  describe("stay accommodation in the compact format", () => {
    const roundTrip = (stayOrigins: TripPayload["stayOrigins"]) =>
      decodePayload(encodePayload(payload({ stayOrigins })))?.stayOrigins;

    it("preserves coordinates and source through a round trip", () => {
      const lodging = {
        name: "Hotel Gracery Shinjuku",
        lat: 35.6955,
        lng: 139.7006,
        source: "geocoded" as const,
      };
      expect(roundTrip({ "Tokyo-0": lodging })).toEqual({ "Tokyo-0": lodging });
    });

    it("preserves a pinned accommodation's source", () => {
      const lodging = { name: "My Airbnb", lat: 34.6937, lng: 135.5023, source: "pinned" as const };
      expect(roundTrip({ "Osaka-2": lodging })).toEqual({ "Osaka-2": lodging });
    });

    it("preserves negative coordinates", () => {
      const lodging = { name: "Southern Cross", lat: -33.8688, lng: -70.6693, source: "pinned" as const };
      expect(roundTrip({ "Tokyo-0": lodging })).toEqual({ "Tokyo-0": lodging });
    });

    it("round-trips a name-only accommodation", () => {
      expect(roundTrip({ "Tokyo-0": { name: "Sakura Inn" } })).toEqual({
        "Tokyo-0": { name: "Sakura Inn" },
      });
    });

    it("drops only the address, which the compact format deliberately does not carry", () => {
      const decoded = roundTrip({
        "Tokyo-0": {
          name: "Hotel Gracery",
          lat: 35.6955,
          lng: 139.7006,
          address: "1-19-1 Kabukicho, Shinjuku, Tokyo",
          source: "geocoded",
        },
      });
      expect(decoded?.["Tokyo-0"]).toEqual({
        name: "Hotel Gracery",
        lat: 35.6955,
        lng: 139.7006,
        source: "geocoded",
      });
    });

    it("survives names containing the format's own delimiters", () => {
      for (const name of [
        "Hotel: The Best | Tokyo ~ Annex",
        "B&B #3 (50% off)",
        "Ryokan ~ Kyoto",
        "旅館 さくら",
        "Hotel:::::",
      ]) {
        const lodging = { name, lat: 35.6, lng: 139.7, source: "pinned" as const };
        expect(roundTrip({ "Tokyo-0": lodging })).toEqual({ "Tokyo-0": lodging });
      }
    });

    it("keeps a name with delimiters from corrupting the rest of the payload", () => {
      const original = payload({
        startCity: "Tokyo",
        manualMoves: { [SENSOJI]: 1 },
        stayOrigins: { "Tokyo-0": { name: "A~B|C:D", lat: 35.6, lng: 139.7 } },
      });
      expect(decodePayload(encodePayload(original))).toEqual(original);
    });

    it("preserves several stays at once", () => {
      const stays = {
        "Tokyo-0": { name: "Tokyo Hotel", lat: 35.68, lng: 139.76, source: "geocoded" as const },
        "Kyoto-3": { name: "Kyoto Ryokan" },
      };
      expect(roundTrip(stays)).toEqual(stays);
    });

    it("still reads a legacy compact link whose stay is plain text", () => {
      // What encodePayload used to emit: `key:name`, no coordinates.
      const legacy = `2026-04-01~2026-04-03~2~transit~0~:~~~Tokyo-0:Sakura Inn`;
      const decoded = decodePayload(legacy);
      expect(decoded).not.toBeNull();
      expect(decoded?.stayOrigins["Tokyo-0"]).toEqual({ name: "Sakura Inn" });
    });

    it("reads a legacy compact stay name that happens to contain colons", () => {
      const legacy = `2026-04-01~2026-04-03~2~transit~0~:~~~Tokyo-0:Hotel: Annex: East`;
      expect(decodePayload(legacy)?.stayOrigins["Tokyo-0"]).toEqual({
        name: "Hotel: Annex: East",
      });
    });

    it("ignores a stay entry with no key or no value", () => {
      const broken = `2026-04-01~2026-04-03~2~transit~0~:~~~:orphan|Tokyo-0:|`;
      const decoded = decodePayload(broken);
      expect(decoded).not.toBeNull();
      expect(decoded?.stayOrigins).toEqual({});
    });

    /**
     * The compact string is opaque and must be URL-encoded by whoever puts it in `?p=`.
     * Without that, the URL layer percent-decodes the escaped name before decodePayload
     * sees it, and a name containing `|` splits into two entries — silently truncating the
     * accommodation. Both callers (Wizard.shareTrip and POST /api/itinerary) encode.
     */
    it("survives a full round trip through a URL query parameter", () => {
      const original = payload({
        stayOrigins: {
          "Tokyo-0": { name: "Annex|East ~ 50% off", lat: 35.6955, lng: 139.7022, source: "pinned" },
        },
      });
      const url = new URL(
        `http://example.test/itinerary/view?p=${encodeURIComponent(encodePayload(original))}`
      );
      expect(decodePayload(url.searchParams.get("p")!)).toEqual(original);
    });

    it("routes hostile compact coordinates through parsePayload's range checks", () => {
      const hostile = `2026-04-01~2026-04-03~2~transit~0~:~~~Tokyo-0:999:139.7:p:Fake`;
      const decoded = decodePayload(hostile);
      expect(decoded?.stayOrigins["Tokyo-0"]).toEqual({ name: "Fake" });
    });
  });
});
