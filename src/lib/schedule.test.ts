import { describe, it, expect } from "vitest";
import { applyTicketTimes, estimateTravelMinutes, formatClock, buildDaySchedule } from "@/lib/schedule";
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

describe("estimateTravelMinutes", () => {
  it("uses rail speeds for intercity hops instead of city pace", () => {
    // Tokyo to Nikko is about 115 km in a straight line and a little over two hours by train.
    const nikko = estimateTravelMinutes(115, "transit");
    expect(nikko).toBeGreaterThan(100);
    expect(nikko).toBeLessThan(200);
    // Osaka to Kyoto, about 40 km.
    expect(estimateTravelMinutes(40, "transit")).toBeLessThan(90);
  });

  it("is at least 5 minutes and rounded to 5", () => {
    const m = estimateTravelMinutes(0.1, "walking");
    expect(m).toBe(5);
    expect(m % 5).toBe(0);
  });

  it("grows with distance and is faster by transit than on foot", () => {
    expect(estimateTravelMinutes(10, "transit")).toBeLessThan(estimateTravelMinutes(10, "walking"));
    expect(estimateTravelMinutes(20, "transit")).toBeGreaterThan(estimateTravelMinutes(5, "transit"));
  });
});

describe("formatClock", () => {
  it("formats minutes past midnight as HH:MM", () => {
    expect(formatClock(7 * 60 + 30)).toBe("07:30");
    expect(formatClock(10 * 60 + 5)).toBe("10:05");
    expect(formatClock(0)).toBe("00:00");
  });
});

describe("buildDaySchedule", () => {
  const namba: NavPoint = { name: "Namba", lat: 34.6659, lng: 135.5012 };

  it("returns [] for an empty day", () => {
    expect(buildDaySchedule(day(0, []), namba, "transit")).toEqual([]);
  });

  it("starts with a wake entry, then travel to and a visit at each place (USJ example)", () => {
    const schedule = buildDaySchedule(day(0, [byId("osaka-usj")]), namba, "transit");

    expect(schedule[0]).toMatchObject({ kind: "wake", time: 7 * 60 + 30 });
    const travel = schedule.find((e) => e.kind === "travel");
    const visit = schedule.find((e) => e.kind === "visit");
    expect(travel).toBeDefined();
    expect(visit).toBeDefined();
    if (travel?.kind === "travel") {
      expect(travel.from).toBe("Namba");
      expect(travel.to).toBe("Universal Studios Japan");
      expect(travel.url).toContain("google.com/maps/dir");
      // leaves after the morning buffer (07:30 + 90 = 09:00)
      expect(travel.time).toBe(9 * 60);
    }
    if (visit?.kind === "visit") {
      expect(visit.place.id).toBe("osaka-usj");
      expect(visit.endTime).toBeGreaterThan(visit.time);
    }
  });

  it("without an origin, begins at the first attraction (no leading travel leg)", () => {
    const schedule = buildDaySchedule(
      day(0, [byId("osaka-dotonbori"), byId("osaka-castle")]),
      null,
      "transit"
    );
    // wake, then a visit (not a travel) as the first activity
    expect(schedule[0].kind).toBe("wake");
    expect(schedule[1].kind).toBe("visit");
    // one travel leg between the two places
    expect(schedule.filter((e) => e.kind === "travel")).toHaveLength(1);
  });
});

describe("ticket times", () => {
  const HOTEL: NavPoint = { name: "Hotel", lat: 35.7101, lng: 139.8107 };
  const visits = (entries: ReturnType<typeof buildDaySchedule>) =>
    entries.filter((e) => e.kind === "visit");

  it("starts the day in time for a ticketed first stop", () => {
    const d = day(0, [byId("tokyo-teamlab")]);
    const entries = buildDaySchedule(d, HOTEL, "transit", { fixedTimes: { "tokyo-teamlab": "14:30" } });
    const [visit] = visits(entries);
    expect(formatClock(visit.time)).toBe("14:30");
    expect(visit.kind === "visit" && visit.late).toBeUndefined();
    const travel = entries.find((e) => e.kind === "travel");
    expect(travel && travel.time + (travel.kind === "travel" ? travel.minutes : 0)).toBe(visit.time);
  });

  it("waits for the slot when early and reports the delay when late", () => {
    const d = day(0, [byId("tokyo-sensoji"), byId("tokyo-teamlab")]);
    const early = visits(buildDaySchedule(d, HOTEL, "transit", { fixedTimes: { "tokyo-teamlab": "18:00" } }));
    expect(formatClock(early[1].time)).toBe("18:00");

    const late = visits(buildDaySchedule(d, HOTEL, "transit", { fixedTimes: { "tokyo-teamlab": "09:30" } }));
    expect(late[1].kind === "visit" && late[1].late).toBeGreaterThan(0);
  });

  it("moves a ticketed place ahead of stops that would make it late", () => {
    const days = [day(0, [byId("tokyo-sensoji"), byId("tokyo-meiji"), byId("tokyo-teamlab")])];
    const morning = applyTicketTimes(days, { "tokyo-teamlab": "09:00" }, "transit");
    expect(morning[0].places[0].id).toBe("tokyo-teamlab");

    const evening = applyTicketTimes(days, { "tokyo-teamlab": "19:00" }, "transit");
    expect(evening[0].places.map((p) => p.id)).toEqual(["tokyo-sensoji", "tokyo-meiji", "tokyo-teamlab"]);
  });

  it("leaves days alone when nothing has a ticket time", () => {
    const days = [day(0, [byId("tokyo-sensoji"), byId("tokyo-meiji")])];
    expect(applyTicketTimes(days, {}, "transit")).toBe(days);
  });
});
