import { describe, it, expect } from "vitest";
import { PLACES } from "@/data/places";
import {
  buildPayload,
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
      stayOrigins: { "Tokyo-0": "Hotel Example" },
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
      stayOrigins: { "Tokyo-0": "Hotel Example" },
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

  it("trims stay origins, drops blanks, and caps their length", () => {
    const parsed = parsePayload({
      ...payload(),
      stayOrigins: {
        "Tokyo-0": "  Hotel Example  ",
        "Kyoto-3": "   ",
        "Osaka-5": 42,
        "Nara-7": "x".repeat(500),
      },
    });
    expect(parsed?.stayOrigins["Tokyo-0"]).toBe("Hotel Example");
    expect("Kyoto-3" in parsed!.stayOrigins).toBe(false);
    expect("Osaka-5" in parsed!.stayOrigins).toBe(false);
    expect(parsed?.stayOrigins["Nara-7"]).toHaveLength(120);
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
});
