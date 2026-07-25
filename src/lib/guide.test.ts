import { describe, it, expect } from "vitest";
import type { Place } from "@/data/places";
import type { LodgingArea } from "@/data/lodging";
import type { Day } from "@/lib/itinerary";
import type { StayRecommendation } from "@/lib/lodging";
import { hasCoords, type NavOrigin } from "@/lib/navigation";
import {
  EMPTY_PROGRESS,
  GUIDE_STORAGE_PREFIX,
  activeDayIndex,
  buildGuideDays,
  completeLeg,
  currentLeg,
  guideOrigins,
  guideStorageKey,
  isDayDone,
  legsDone,
  parseProgress,
  resetDay,
  serializeProgress,
  startTrip,
  stayKey,
  textOrigin,
  tripPosition,
  tripProgress,
  undoLeg,
  type GuideDay,
  type GuideProgress,
} from "@/lib/guide";

const place = (id: string, lat: number, lng: number, city = "Osaka"): Place => ({
  id,
  name: id,
  city,
  region: "Osaka",
  category: "landmark",
  description: "",
  lat,
  lng,
  activities: [],
});

/** A place with no usable coordinates — the guide has nowhere to send you. */
const placeless = (id: string): Place => ({
  ...place(id, 0, 0),
  lat: Number.NaN,
  lng: Number.NaN,
});

const day = (dayIndex: number, places: Place[]): Day => ({
  dayIndex,
  date: new Date(2026, 3, 1 + dayIndex),
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

const rec = (
  dayIndexes: number[],
  areas: LodgingArea[],
  places: Place[] = []
): StayRecommendation => ({
  stay: {
    region: "Osaka",
    dayIndexes,
    nights: dayIndexes.length,
    checkIn: new Date(2026, 3, 1 + dayIndexes[0]),
    checkOut: new Date(2026, 3, 2 + dayIndexes[dayIndexes.length - 1]),
    places,
  },
  areas,
});

const USJ = place("usj", 34.6654, 135.4323);
const DOTONBORI = place("dotonbori", 34.6687, 135.5013);
const CASTLE = place("castle", 34.6873, 135.5259);
const NAMBA = area("osaka-namba", "Namba / Dotonbori", 34.6659, 135.5012);

/** Progress for a trip already under way, so tests can focus on the counts. */
const p = (done: Record<number, number>): GuideProgress => ({ started: true, done });

/** A guide day whose `count` attractions all follow a coordinate origin. */
function guideDayWithLegs(dayIndex: number, count: number): GuideDay {
  const places = [USJ, DOTONBORI, CASTLE].slice(0, count);
  return buildGuideDays(
    [day(dayIndex, places)],
    new Map<number, NavOrigin>([[dayIndex, { name: NAMBA.name, lat: NAMBA.lat, lng: NAMBA.lng }]]),
    "transit"
  )[0];
}

describe("stayKey", () => {
  it("joins region and first day index", () => {
    expect(stayKey("Osaka", 0)).toBe("Osaka-0");
    expect(stayKey("Kyushu (Fukuoka / Beppu / Nagasaki)", 4)).toBe(
      "Kyushu (Fukuoka / Beppu / Nagasaki)-4"
    );
  });
});

describe("textOrigin", () => {
  it("keeps the typed name for display and adds the city for geocoding", () => {
    const origin = textOrigin("Sakura Inn", "Osaka");
    expect(origin.name).toBe("Sakura Inn");
    expect(hasCoords(origin)).toBe(false);
    expect(origin).toMatchObject({ query: "Sakura Inn, Osaka" });
  });

  it("does not repeat a city the traveler already typed", () => {
    expect(textOrigin("Sakura Inn Osaka", "Osaka")).toMatchObject({ query: "Sakura Inn Osaka" });
    expect(textOrigin("Sakura Inn OSAKA", "Osaka")).toMatchObject({ query: "Sakura Inn OSAKA" });
  });

  it("uses the name alone when there is no city to anchor it", () => {
    expect(textOrigin("  Sakura Inn  ")).toEqual({ name: "Sakura Inn", query: "Sakura Inn" });
  });
});

describe("guideOrigins", () => {
  it("starts every day of a stay from the stay's top lodging area", () => {
    const origins = guideOrigins([rec([0, 1, 2], [NAMBA, area("b", "B", 34.7, 135.5)])]);
    for (const dayIndex of [0, 1, 2]) {
      expect(origins.get(dayIndex)).toEqual({
        name: "Namba / Dotonbori",
        lat: 34.6659,
        lng: 135.5012,
      });
    }
  });

  it("prefers the hotel the traveler typed over the recommendation", () => {
    const origins = guideOrigins([rec([0, 1], [NAMBA], [USJ])], { "Osaka-0": "Sakura Inn" });
    const origin = origins.get(0)!;
    expect(hasCoords(origin)).toBe(false);
    expect(origin).toEqual({ name: "Sakura Inn", query: "Sakura Inn, Osaka" });
    expect(origins.get(1)).toEqual(origin);
  });

  it("anchors a typed hotel to the city, not the attraction's district", () => {
    // The hotel is very often in a different district than the day's first stop, so
    // "Konohana, Osaka" would point Google at the wrong neighbourhood.
    const inDistrict = place("usj", 34.6654, 135.4323, "Konohana, Osaka");
    const origins = guideOrigins([rec([0], [NAMBA], [inDistrict])], { "Osaka-0": "Sakura Inn" });
    expect(origins.get(0)).toMatchObject({ query: "Sakura Inn, Osaka" });
  });

  it("uses a single-part city as-is", () => {
    const simple = place("beppu-onsen", 33.2794, 131.5006, "Beppu");
    const origins = guideOrigins([rec([0], [NAMBA], [simple])], { "Osaka-0": "Sakura Inn" });
    expect(origins.get(0)).toMatchObject({ query: "Sakura Inn, Beppu" });
  });

  it("ignores a whitespace-only hotel and falls back to the recommendation", () => {
    const origins = guideOrigins([rec([0], [NAMBA])], { "Osaka-0": "   " });
    expect(hasCoords(origins.get(0)!)).toBe(true);
  });

  it("keys the typed hotel by region and the stay's first day", () => {
    const recs = [rec([0, 1], [NAMBA]), rec([2, 3], [NAMBA])];
    const origins = guideOrigins(recs, { "Osaka-2": "Second Hotel" });
    expect(hasCoords(origins.get(0)!)).toBe(true);
    expect(origins.get(2)).toMatchObject({ name: "Second Hotel" });
    expect(origins.get(3)).toMatchObject({ name: "Second Hotel" });
  });

  it("gives no origin for a stay with no areas and no typed hotel", () => {
    const origins = guideOrigins([rec([0], [])]);
    expect(origins.has(0)).toBe(false);
  });

  it("returns nothing when there are no stays", () => {
    expect(guideOrigins([]).size).toBe(0);
  });
});

describe("buildGuideDays", () => {
  const origins = new Map<number, NavOrigin>([
    [0, { name: NAMBA.name, lat: NAMBA.lat, lng: NAMBA.lng }],
  ]);

  it("creates one leg per attraction, starting from the origin", () => {
    const [built] = buildGuideDays([day(0, [USJ, DOTONBORI])], origins, "transit");
    expect(built.legs).toHaveLength(2);
    expect(built.legs[0].from.name).toBe("Namba / Dotonbori");
    expect(built.legs[0].to.name).toBe("usj");
    expect(built.legs[0].place.id).toBe("usj");
    expect(built.legs[1].from.name).toBe("usj");
    expect(built.legs[1].to.name).toBe("dotonbori");
  });

  it("numbers legs from zero, in order", () => {
    const [built] = buildGuideDays([day(0, [USJ, DOTONBORI, CASTLE])], origins, "transit");
    expect(built.legs.map((l) => l.index)).toEqual([0, 1, 2]);
  });

  it("carries the day index and date through", () => {
    const [built] = buildGuideDays([day(0, [USJ])], origins, "transit");
    expect(built.dayIndex).toBe(0);
    expect(built.date.getDate()).toBe(1);
    expect(built.date.getMonth()).toBe(3);
  });

  it("measures distance from a coordinate origin", () => {
    const [built] = buildGuideDays([day(0, [USJ])], origins, "transit");
    expect(built.legs[0].straightLineKm).toBeGreaterThan(0);
  });

  it("reports no distance from a typed hotel rather than inventing one", () => {
    const typed = new Map<number, NavOrigin>([[0, { name: "Sakura Inn", query: "Sakura Inn" }]]);
    const [built] = buildGuideDays([day(0, [USJ, DOTONBORI])], typed, "transit");
    expect(built.legs[0].straightLineKm).toBeNull();
    // Once travelling between known places, distance is measurable again.
    expect(built.legs[1].straightLineKm).toBeGreaterThan(0);
  });

  it("links to Google Maps using the typed text as the origin", () => {
    const typed = new Map<number, NavOrigin>([
      [0, { name: "Sakura Inn", query: "Sakura Inn, Osaka" }],
    ]);
    const [built] = buildGuideDays([day(0, [USJ])], typed, "walking");
    expect(built.legs[0].directionsUrl).toContain(encodeURIComponent("Sakura Inn, Osaka"));
    expect(built.legs[0].directionsUrl).toContain("travelmode=walking");
  });

  it("never attaches a travel duration or arrival time to a leg", () => {
    const [built] = buildGuideDays([day(0, [USJ, DOTONBORI])], origins, "transit");
    for (const leg of built.legs) {
      expect(Object.keys(leg).sort()).toEqual(
        ["directionsUrl", "from", "index", "place", "straightLineKm", "to"].sort()
      );
    }
  });

  it("begins at the first attraction when the day has no origin", () => {
    const [built] = buildGuideDays([day(0, [USJ, DOTONBORI])], new Map(), "transit");
    expect(built.origin).toBeNull();
    expect(built.legs).toHaveLength(1);
    expect(built.legs[0].from.name).toBe("usj");
    expect(built.legs[0].to.name).toBe("dotonbori");
  });

  it("produces no legs for an empty day", () => {
    const [built] = buildGuideDays([day(0, [])], origins, "transit");
    expect(built.legs).toEqual([]);
  });

  it("produces no legs for a single-attraction day with no origin", () => {
    const [built] = buildGuideDays([day(0, [USJ])], new Map(), "transit");
    expect(built.legs).toEqual([]);
  });

  it("skips attractions with no coordinates", () => {
    const [built] = buildGuideDays(
      [day(0, [USJ, placeless("ghost"), DOTONBORI])],
      origins,
      "transit"
    );
    expect(built.legs.map((l) => l.place.id)).toEqual(["usj", "dotonbori"]);
  });

  it("builds every day of the trip", () => {
    const built = buildGuideDays([day(0, [USJ]), day(1, [DOTONBORI])], origins, "transit");
    expect(built.map((d) => d.dayIndex)).toEqual([0, 1]);
    expect(built[1].origin).toBeNull();
  });
});

describe("tripPosition", () => {
  const days = [day(0, []), day(1, []), day(2, [])]; // 1-3 April 2026

  it("reports the calendar day of a trip in progress", () => {
    expect(tripPosition(days, new Date(2026, 3, 1, 9, 0))).toEqual({
      phase: "during",
      dayIndex: 0,
      daysUntilStart: 0,
    });
    expect(tripPosition(days, new Date(2026, 3, 2, 9, 0)).dayIndex).toBe(1);
    expect(tripPosition(days, new Date(2026, 3, 3, 9, 0)).dayIndex).toBe(2);
  });

  it("keeps a late-night traveler on today's day, not tomorrow's", () => {
    expect(tripPosition(days, new Date(2026, 3, 2, 23, 50)).dayIndex).toBe(1);
    expect(tripPosition(days, new Date(2026, 3, 2, 0, 1)).dayIndex).toBe(1);
  });

  it("counts down before the trip starts", () => {
    expect(tripPosition(days, new Date(2026, 2, 30, 12, 0))).toEqual({
      phase: "before",
      dayIndex: 0,
      daysUntilStart: 2,
    });
    expect(tripPosition(days, new Date(2026, 2, 31, 23, 59)).daysUntilStart).toBe(1);
  });

  it("clamps to the last day once the trip is over", () => {
    expect(tripPosition(days, new Date(2026, 3, 4, 8, 0))).toEqual({
      phase: "after",
      dayIndex: 2,
      daysUntilStart: 0,
    });
    expect(tripPosition(days, new Date(2027, 0, 1)).phase).toBe("after");
  });

  it("handles a one-day trip", () => {
    const single = [day(0, [])];
    expect(tripPosition(single, new Date(2026, 3, 1, 10, 0)).phase).toBe("during");
    expect(tripPosition(single, new Date(2026, 3, 2, 10, 0)).phase).toBe("after");
  });

  it("survives an empty trip", () => {
    expect(tripPosition([], new Date(2026, 3, 1))).toEqual({
      phase: "before",
      dayIndex: 0,
      daysUntilStart: 0,
    });
  });

  it("is unaffected by a daylight-saving shift in the middle of the trip", () => {
    // US DST begins 8 March 2026; a naive ms/86400000 division would drift by an hour.
    const spring = [0, 1, 2, 3].map((i) => ({ date: new Date(2026, 2, 6 + i) }));
    expect(tripPosition(spring, new Date(2026, 2, 9, 12, 0)).dayIndex).toBe(3);
  });
});

describe("progress bookkeeping", () => {
  const threeLegs = guideDayWithLegs(0, 3);

  it("starts with nothing done", () => {
    expect(legsDone(EMPTY_PROGRESS, 0)).toBe(0);
    expect(isDayDone(threeLegs, EMPTY_PROGRESS)).toBe(false);
    expect(currentLeg(threeLegs, EMPTY_PROGRESS)?.place.id).toBe("usj");
  });

  it("treats a negative stored count as nothing done", () => {
    expect(legsDone(p({ 0: -3 }), 0)).toBe(0);
  });

  it("advances one leg at a time when a leg is completed", () => {
    let progress: GuideProgress = EMPTY_PROGRESS;
    progress = completeLeg(progress, threeLegs);
    expect(legsDone(progress, 0)).toBe(1);
    expect(currentLeg(threeLegs, progress)?.place.id).toBe("dotonbori");

    progress = completeLeg(progress, threeLegs);
    expect(currentLeg(threeLegs, progress)?.place.id).toBe("castle");
  });

  it("finishes the day after the last leg and offers nothing further", () => {
    let progress: GuideProgress = EMPTY_PROGRESS;
    for (let i = 0; i < 3; i++) progress = completeLeg(progress, threeLegs);
    expect(isDayDone(threeLegs, progress)).toBe(true);
    expect(currentLeg(threeLegs, progress)).toBeNull();
  });

  it("cannot be pushed past the end of the day by repeated taps", () => {
    let progress: GuideProgress = EMPTY_PROGRESS;
    for (let i = 0; i < 10; i++) progress = completeLeg(progress, threeLegs);
    expect(legsDone(progress, 0)).toBe(3);
  });

  it("does not mutate the progress it is given", () => {
    const before: GuideProgress = p({ 0: 1 });
    completeLeg(before, threeLegs);
    undoLeg(before, 0);
    resetDay(before, 0);
    expect(before).toEqual(p({ 0: 1 }));
  });

  it("leaves other days alone when one day advances", () => {
    const progress = completeLeg(p({ 1: 2, 5: 1 }), threeLegs);
    expect(progress.done).toEqual({ 0: 1, 1: 2, 5: 1 });
  });

  it("keeps the trip marked as started while progress moves", () => {
    expect(completeLeg(p({}), threeLegs).started).toBe(true);
    expect(undoLeg(p({ 0: 1 }), 0).started).toBe(true);
    expect(resetDay(p({ 0: 1 }), 0).started).toBe(true);
  });

  it("counts an empty day as already done, so the guide can move on", () => {
    const empty = buildGuideDays([day(0, [])], new Map(), "transit")[0];
    expect(isDayDone(empty, EMPTY_PROGRESS)).toBe(true);
    expect(currentLeg(empty, EMPTY_PROGRESS)).toBeNull();
  });

  it("steps back one leg on undo, and stops at the start", () => {
    expect(undoLeg(p({ 0: 2 }), 0).done[0]).toBe(1);
    expect(undoLeg(p({ 0: 0 }), 0).done[0]).toBe(0);
    expect(undoLeg(EMPTY_PROGRESS, 0).done[0]).toBe(0);
  });

  it("clears a day on reset without touching the rest", () => {
    expect(resetDay(p({ 0: 3, 1: 2 }), 0).done).toEqual({ 0: 0, 1: 2 });
  });
});

describe("startTrip", () => {
  it("has not started until the traveler says so", () => {
    expect(EMPTY_PROGRESS.started).toBe(false);
  });

  it("marks the trip as started without disturbing progress", () => {
    expect(startTrip({ started: false, done: { 0: 1 } })).toEqual({
      started: true,
      done: { 0: 1 },
    });
  });

  it("is idempotent", () => {
    expect(startTrip(startTrip(EMPTY_PROGRESS)).started).toBe(true);
  });
});

describe("activeDayIndex", () => {
  const guideDays = [guideDayWithLegs(0, 2), guideDayWithLegs(1, 2), guideDayWithLegs(2, 2)];

  it("follows the clock while there is work left today", () => {
    expect(activeDayIndex(guideDays, EMPTY_PROGRESS, new Date(2026, 3, 2, 10, 0))).toBe(1);
  });

  it("moves to the next day once today is finished", () => {
    expect(activeDayIndex(guideDays, p({ 0: 2 }), new Date(2026, 3, 1, 20, 0))).toBe(1);
  });

  it("skips over several finished days", () => {
    expect(activeDayIndex(guideDays, p({ 0: 2, 1: 2 }), new Date(2026, 3, 1, 20, 0))).toBe(2);
  });

  it("stays on the last day when everything is finished", () => {
    const progress = p({ 0: 2, 1: 2, 2: 2 });
    expect(activeDayIndex(guideDays, progress, new Date(2026, 3, 1, 20, 0))).toBe(2);
  });

  it("does not rewind to an unfinished earlier day", () => {
    // Day 0 was never ticked off, but it is day 3 now; the guide looks forward.
    expect(activeDayIndex(guideDays, EMPTY_PROGRESS, new Date(2026, 3, 3, 9, 0))).toBe(2);
  });

  it("shows day 1 before the trip begins", () => {
    expect(activeDayIndex(guideDays, EMPTY_PROGRESS, new Date(2026, 2, 20))).toBe(0);
  });

  it("returns 0 for an empty trip", () => {
    expect(activeDayIndex([], EMPTY_PROGRESS, new Date(2026, 3, 1))).toBe(0);
  });
});

describe("tripProgress", () => {
  const guideDays = [guideDayWithLegs(0, 2), guideDayWithLegs(1, 3)];

  it("totals the legs across the trip", () => {
    expect(tripProgress(guideDays, EMPTY_PROGRESS)).toEqual({ done: 0, total: 5 });
  });

  it("counts completed legs from every day", () => {
    expect(tripProgress(guideDays, p({ 0: 2, 1: 1 }))).toEqual({ done: 3, total: 5 });
  });

  it("does not let a day's stored count exceed that day's legs", () => {
    expect(tripProgress(guideDays, p({ 0: 99 }))).toEqual({ done: 2, total: 5 });
  });

  it("ignores counts for days the trip does not have", () => {
    expect(tripProgress(guideDays, p({ 7: 5 })).done).toBe(0);
  });
});

describe("guideStorageKey", () => {
  it("namespaces by share code", () => {
    expect(guideStorageKey("ABCD2345")).toBe(`${GUIDE_STORAGE_PREFIX}ABCD2345`);
  });

  it("keys two trips separately", () => {
    expect(guideStorageKey("ABCD2345")).not.toBe(guideStorageKey("WXYZ6789"));
  });

  it("normalizes the code, so a pasted variant finds the same progress", () => {
    expect(guideStorageKey("abcd-2345")).toBe(guideStorageKey("ABCD2345"));
    expect(guideStorageKey(" abcd 2345 ")).toBe(guideStorageKey("ABCD2345"));
  });
});

describe("parseProgress", () => {
  it("round-trips what serializeProgress writes", () => {
    for (const progress of [p({ 0: 2, 3: 1 }), EMPTY_PROGRESS, { started: false, done: { 1: 4 } }]) {
      expect(parseProgress(serializeProgress(progress))).toEqual(progress);
    }
  });

  it("remembers that the trip was started, across a reload", () => {
    expect(parseProgress('{"started":true,"done":{}}').started).toBe(true);
  });

  it("treats a missing or non-true started flag as not started", () => {
    expect(parseProgress('{"done":{"0":1}}').started).toBe(false);
    expect(parseProgress('{"started":"yes","done":{}}').started).toBe(false);
    expect(parseProgress('{"started":1,"done":{}}').started).toBe(false);
  });

  it("returns empty progress for missing or unusable storage", () => {
    for (const raw of [null, "", "not json", "[1,2]", "42", '"x"', "null"]) {
      expect(parseProgress(raw)).toEqual(EMPTY_PROGRESS);
    }
  });

  it("returns no counts when the done map is the wrong shape", () => {
    expect(parseProgress('{"done":"nope"}')).toEqual(EMPTY_PROGRESS);
    expect(parseProgress('{"done":[1,2]}')).toEqual(EMPTY_PROGRESS);
    expect(parseProgress("{}")).toEqual(EMPTY_PROGRESS);
    // A corrupt done map does not lose the fact that the trip was started.
    expect(parseProgress('{"started":true,"done":"nope"}')).toEqual({ started: true, done: {} });
  });

  it("drops entries that are not whole non-negative counts", () => {
    const parsed = parseProgress(
      '{"done":{"0":2,"1":-1,"2":"3","3":null,"4":1.9,"bad":5,"-2":1}}'
    );
    expect(parsed.done).toEqual({ 0: 2, 4: 1 });
  });

  it("ignores anything alongside the flag and the done map", () => {
    expect(parseProgress('{"started":true,"done":{"0":1},"evil":true}')).toEqual({
      started: true,
      done: { 0: 1 },
    });
  });
});
