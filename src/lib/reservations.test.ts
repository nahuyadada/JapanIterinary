import { describe, it, expect } from "vitest";
import {
  resolveBooking,
  resolveOpenDate,
  tripChecklist,
  noBookingNeededCount,
  STATUS_DISPLAY,
} from "@/lib/reservations";
import { RESERVATION_META } from "@/data/reservations";
import { PLACES } from "@/data/places";
import type { Place } from "@/data/places";
import type { Day } from "@/lib/itinerary";

const byId = (id: string): Place => {
  const p = PLACES.find((x) => x.id === id);
  if (!p) throw new Error(`missing test fixture place: ${id}`);
  return p;
};

const day = (dayIndex: number, places: Place[]): Day => ({
  dayIndex,
  date: new Date(2026, 8, 20 + dayIndex),
  places,
});

// Fixed reference points so nothing depends on the real clock.
const TODAY = new Date(2026, 6, 25); // 2026-07-25
const VISIT = new Date(2026, 8, 20); // 2026-09-20

describe("data integrity", () => {
  it("covers every place in the catalog", () => {
    const missing = PLACES.filter((p) => !(p.id in RESERVATION_META)).map((p) => p.id);
    expect(missing).toEqual([]);
  });

  it("has no entries for places that do not exist", () => {
    const ids = new Set(PLACES.map((p) => p.id));
    const orphans = Object.keys(RESERVATION_META).filter((id) => !ids.has(id));
    expect(orphans).toEqual([]);
  });

  it("only uses https booking URLs", () => {
    const bad = Object.entries(RESERVATION_META)
      .filter(([, m]) => m.officialBookingUrl && !m.officialBookingUrl.startsWith("https://"))
      .map(([id]) => id);
    expect(bad).toEqual([]);
  });

  it("never lets a required place claim door entry", () => {
    // walkIn can never be true where a reservation is required — that would contradict
    // the status, which is exactly the drift this table is shaped to prevent.
    const contradictions = Object.entries(RESERVATION_META)
      .filter(([, m]) => m.status === "required" && m.walkIn === true)
      .map(([id]) => id);
    expect(contradictions).toEqual([]);
  });

  it("gives every place that needs action a recommended lead time", () => {
    const vague = Object.entries(RESERVATION_META)
      .filter(([, m]) => m.status !== "none" && !m.recommendedBookingTime)
      .map(([id]) => id);
    expect(vague).toEqual([]);
  });
});

describe("resolveBooking — derived flags", () => {
  it("derives required/no-walk-in for a reservation-only attraction", () => {
    const b = resolveBooking(byId("tokyo-teamlab"), VISIT, TODAY);
    expect(b.status).toBe("required");
    expect(b.reservationRequired).toBe(true);
    expect(b.advanceTicketRequired).toBe(true);
    expect(b.walkInAvailable).toBe(false);
    expect(b.bookingPriority).toBe("high");
  });

  it("derives recommended/walk-in-allowed for a popular observation deck", () => {
    const b = resolveBooking(byId("tokyo-skytree"), VISIT, TODAY);
    expect(b.status).toBe("recommended");
    expect(b.reservationRequired).toBe(false);
    expect(b.walkInAvailable).toBe(true);
    expect(b.bookingPriority).toBe("medium");
  });

  it("derives a no-booking-needed temple as low priority with walk-ins", () => {
    const b = resolveBooking(byId("tokyo-sensoji"), VISIT, TODAY);
    expect(b.status).toBe("none");
    expect(b.reservationRequired).toBe(false);
    expect(b.advanceTicketRequired).toBe(false);
    expect(b.walkInAvailable).toBe(true);
    expect(b.bookingPriority).toBe("low");
    expect(b.notices).toEqual([]);
  });

  it("promotes a sells-out place to high priority even when only recommended", () => {
    const b = resolveBooking(byId("fuji-fujiq"), VISIT, TODAY);
    expect(b.status).toBe("recommended");
    expect(b.bookingPriority).toBe("high");
  });

  it("honors an explicit walk-in override against the status default", () => {
    // The Imperial Palace inner-grounds tour is reservation-only even though the East
    // Gardens are free, so walkIn is pinned false rather than left to inference.
    const b = resolveBooking(byId("tokyo-imperialpalace"), VISIT, TODAY);
    expect(b.status).toBe("required");
    expect(b.walkInAvailable).toBe(false);
  });

  it("reads hours and duration from the shared place metadata", () => {
    const b = resolveBooking(byId("tokyo-teamlab"), VISIT, TODAY);
    expect(b.openingHours).toBe("9:00–21:00");
    expect(b.estimatedVisitDuration).toEqual([2, 3]);
  });

  it("treats an uncurated place as an ordinary walk-in", () => {
    const stranger: Place = { ...byId("tokyo-sensoji"), id: "not-in-the-table" };
    const b = resolveBooking(stranger, VISIT, TODAY);
    expect(b.status).toBe("none");
    expect(b.walkInAvailable).toBe(true);
    expect(b.bookingPriority).toBe("low");
  });
});

describe("resolveOpenDate", () => {
  it("resolves a daysBefore rule by subtracting days from the visit", () => {
    // Shibuya Sky releases slots 14 days ahead: 2026-09-20 → 2026-09-06.
    const d = resolveOpenDate({ kind: "daysBefore", days: 14 }, VISIT);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(6);
  });

  it("resolves a monthlyOn rule to a day-of-month in an earlier month", () => {
    // Ghibli: the 10th of the previous month. 2026-09-20 → 2026-08-10.
    const d = resolveOpenDate({ kind: "monthlyOn", day: 10, monthsBefore: 1 }, VISIT);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(10);
  });

  it("rolls back across a year boundary", () => {
    const d = resolveOpenDate(
      { kind: "monthlyOn", day: 10, monthsBefore: 1 },
      new Date(2027, 0, 5)
    );
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(10);
  });
});

describe("resolveBooking — computed dates", () => {
  it("computes open, book-by, and deadline dates from the visit date", () => {
    const b = resolveBooking(byId("tokyo-ghibli"), VISIT, TODAY);
    // opens: the 10th of the previous month
    expect(b.bookingOpenDate?.getMonth()).toBe(7);
    expect(b.bookingOpenDate?.getDate()).toBe(10);
    // bookBy: the 45-day lead time would be 2026-08-06, but that precedes the sale
    // date, so it is clamped forward to the open date (see the clamp test below).
    expect(b.bookByDate?.getMonth()).toBe(7);
    expect(b.bookByDate?.getDate()).toBe(10);
    // closes 1 day before → 2026-09-19
    expect(b.bookingDeadline?.getMonth()).toBe(8);
    expect(b.bookingDeadline?.getDate()).toBe(19);
  });

  it("never advises booking before the window opens", () => {
    // Ghibli's 45-day lead time lands on Aug 7 for a Sept 21 visit, but tickets do not
    // go on sale until Aug 10. Advising Aug 7 would be advice you cannot act on.
    const b = resolveBooking(byId("tokyo-ghibli"), new Date(2026, 8, 21), TODAY);
    expect(b.bookingOpenDate?.getDate()).toBe(10);
    expect(b.bookByDate?.getTime()).toBe(b.bookingOpenDate?.getTime());
  });

  it("keeps a book-by date that already falls after the window opens", () => {
    // Skytree opens 30 days out and advises 7 days out, so the advice stands unchanged.
    const b = resolveBooking(byId("tokyo-skytree"), VISIT, TODAY);
    expect(b.bookByDate!.getTime()).toBeGreaterThan(b.bookingOpenDate!.getTime());
    expect(b.bookByDate?.getDate()).toBe(13);
  });

  it("leaves dates null when no rule is curated", () => {
    const b = resolveBooking(byId("tokyo-sensoji"), VISIT, TODAY);
    expect(b.bookingOpenDate).toBeNull();
    expect(b.bookByDate).toBeNull();
    expect(b.bookingDeadline).toBeNull();
  });
});

describe("resolveBooking — notices", () => {
  it("says when reservations open while the window is still in the future", () => {
    // teamLab opens 60 days ahead; a November visit keeps that window ahead of TODAY.
    const b = resolveBooking(byId("tokyo-teamlab"), new Date(2026, 10, 1), TODAY);
    expect(b.notices.some((n) => n.startsWith("Reservations open"))).toBe(true);
    expect(b.notices.some((n) => n.includes("60 days before your visit"))).toBe(true);
  });

  it("says booking is open now once the window has arrived", () => {
    const b = resolveBooking(byId("tokyo-teamlab"), VISIT, TODAY);
    expect(b.notices).toContain("Booking is open now — reserve your slot.");
  });

  it("warns about selling out and about door sales being unavailable", () => {
    const b = resolveBooking(byId("tokyo-ghibli"), VISIT, TODAY);
    expect(b.notices).toContain("This attraction frequently sells out.");
    expect(b.notices).toContain("No tickets are sold at the door.");
  });

  it("tells walk-in visitors to expect a wait when only recommended", () => {
    const b = resolveBooking(byId("tokyo-skytree"), VISIT, TODAY);
    expect(b.notices).toContain("Walk-ins are available but waiting times may be long.");
  });

  it("includes a concrete book-by date alongside the lead-time copy", () => {
    const b = resolveBooking(byId("tokyo-teamlab"), VISIT, TODAY);
    const bookBy = b.notices.find((n) => n.includes("book by"));
    expect(bookBy).toContain("2–4 weeks before travel");
    expect(bookBy).toContain("Aug 30");
  });

  it("flags a required booking whose recommended window has already passed", () => {
    // Visiting in two days: the 45-day Ghibli lead time is long gone.
    const b = resolveBooking(byId("tokyo-ghibli"), new Date(2026, 6, 27), TODAY);
    expect(b.notices).toContain(
      "The recommended booking window has already passed — book as soon as you can."
    );
  });

  it("stays silent for places that need nothing", () => {
    expect(resolveBooking(byId("kyoto-fushimi"), VISIT, TODAY).notices).toEqual([]);
  });
});

describe("tripChecklist", () => {
  it("lists only places that need action, leaving walk-in places out", () => {
    const days = [day(0, [byId("tokyo-sensoji"), byId("tokyo-teamlab"), byId("kyoto-fushimi")])];
    const items = tripChecklist(days, TODAY);
    expect(items.map((i) => i.booking.place.id)).toEqual(["tokyo-teamlab"]);
  });

  it("orders high priority before medium", () => {
    const days = [
      day(0, [byId("tokyo-skytree")]), // recommended → medium
      day(1, [byId("tokyo-teamlab")]), // required → high
    ];
    const items = tripChecklist(days, TODAY);
    expect(items.map((i) => i.booking.bookingPriority)).toEqual(["high", "medium"]);
  });

  it("lists a multi-day place once, dated to its first day", () => {
    // USJ spans two days, as buildItinerary allocates for maxDays places.
    const usj = byId("osaka-usj");
    const days = [day(0, [usj]), day(1, [usj])];
    const items = tripChecklist(days, TODAY);
    expect(items).toHaveLength(1);
    expect(items[0].booking.visitDate.getDate()).toBe(20);
  });

  it("describes the action to take per booking type", () => {
    const teamlab = tripChecklist([day(0, [byId("tokyo-teamlab")])], TODAY)[0];
    expect(teamlab.action).toBe("Reserve a time slot and buy tickets in advance");

    const usj = tripChecklist([day(0, [byId("osaka-usj")])], TODAY)[0];
    expect(usj.action).toBe("Purchase tickets in advance");

    const palace = tripChecklist([day(0, [byId("tokyo-imperialpalace")])], TODAY)[0];
    expect(palace.action).toBe("Book before your trip");
  });

  it("is empty for a trip of temples and public streets", () => {
    const days = [day(0, [byId("kyoto-fushimi"), byId("tokyo-shibuya"), byId("nara-park")])];
    expect(tripChecklist(days, TODAY)).toEqual([]);
  });

  it("counts the places that need no booking", () => {
    const days = [day(0, [byId("kyoto-fushimi"), byId("tokyo-teamlab"), byId("nara-park")])];
    expect(noBookingNeededCount(days)).toBe(2);
  });

  it("counts a place appearing on several days only once", () => {
    const fushimi = byId("kyoto-fushimi");
    expect(noBookingNeededCount([day(0, [fushimi]), day(1, [fushimi])])).toBe(1);
  });
});

describe("STATUS_DISPLAY", () => {
  it("maps each status to its traffic-light marker", () => {
    expect(STATUS_DISPLAY.none.dot).toBe("🟢");
    expect(STATUS_DISPLAY.recommended.dot).toBe("🟡");
    expect(STATUS_DISPLAY.required.dot).toBe("🔴");
  });
});
