import type { Place } from "@/data/places";
import type { Day } from "@/lib/itinerary";
import { durationRangeFor, type HourRange } from "@/lib/duration";
import { placeHours } from "@/data/placeMeta";
import {
  reservationMeta,
  type BookingOpens,
  type BookingStatus,
  type ReservationMeta,
} from "@/data/reservations";

export type { BookingStatus };

const MS_PER_DAY = 86_400_000;

export type BookingPriority = "high" | "medium" | "low";

/** Display metadata per status. `dot` is the traffic-light marker. */
export const STATUS_DISPLAY: Record<BookingStatus, { dot: string; label: string; blurb: string }> = {
  none: {
    dot: "🟢",
    label: "No reservation needed",
    blurb: "Walk-ins are generally available.",
  },
  recommended: {
    dot: "🟡",
    label: "Reservation recommended",
    blurb: "Walk-ins may be available, but entry slots can sell out in busy periods.",
  },
  required: {
    dot: "🔴",
    label: "Reservation required",
    blurb: "You must reserve or buy tickets before visiting.",
  },
};

export const PRIORITY_LABELS: Record<BookingPriority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

/** Everything the UI shows for one activity's booking requirements. */
export type ResolvedBooking = {
  place: Place;
  visitDate: Date;
  status: BookingStatus;
  reservationRequired: boolean;
  advanceTicketRequired: boolean;
  walkInAvailable: boolean;
  timeSlotRequired: boolean;
  sellsOut: boolean;
  recommendedBookingTime: string | null;
  /** Earliest date a booking can be made, resolved from the curated rule. */
  bookingOpenDate: Date | null;
  /** Last date a booking can be made. */
  bookingDeadline: Date | null;
  /** Advised date to have booked by, from the recommended lead time. */
  bookByDate: Date | null;
  officialBookingUrl: string | null;
  ticketPrice: string | null;
  openingHours: string;
  estimatedVisitDuration: HourRange;
  notes: string | null;
  bookingPriority: BookingPriority;
  /** Traveler-facing reminders, most urgent first. */
  notices: string[];
};

/** Anything not in the curated table is treated as an ordinary walk-in place. */
const FALLBACK: ReservationMeta = { status: "none", advanceTicket: false };

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** `days` before `d`, normalized to local midnight. */
function shiftDays(d: Date, days: number): Date {
  return atMidnight(new Date(atMidnight(d).getTime() - days * MS_PER_DAY));
}

/** Whole days from `from` to `to`; negative once `to` is in the past. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((atMidnight(to).getTime() - atMidnight(from).getTime()) / MS_PER_DAY);
}

/**
 * Resolve a booking-opens rule against a visit date.
 * `monthlyOn` walks back whole months and lands on a day-of-month — the shape used by
 * the Ghibli Museum ("the 10th of the previous month") and Imperial Household tours.
 */
export function resolveOpenDate(opens: BookingOpens, visitDate: Date): Date {
  if (opens.kind === "daysBefore") return shiftDays(visitDate, opens.days);
  const v = atMidnight(visitDate);
  return new Date(v.getFullYear(), v.getMonth() - opens.monthsBefore, opens.day);
}

/** Short, locale-aware date for display, e.g. "Fri, Aug 21". */
export function formatBookingDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Traveler reminders for a resolved booking, most urgent first: what sells out, when
 * the window opens, when to act, and what to expect on a walk-in.
 */
function buildNotices(
  r: Omit<ResolvedBooking, "notices">,
  meta: ReservationMeta,
  today: Date
): string[] {
  // Nothing to book means nothing to nag about.
  if (r.status === "none") return [];

  const out: string[] = [];
  if (r.sellsOut) out.push("This attraction frequently sells out.");

  if (r.bookingOpenDate) {
    if (daysBetween(today, r.bookingOpenDate) > 0) {
      const lead =
        meta.opens?.kind === "daysBefore" ? `, ${meta.opens.days} days before your visit` : "";
      out.push(`Reservations open ${formatBookingDate(r.bookingOpenDate)}${lead}.`);
    } else {
      out.push("Booking is open now — reserve your slot.");
    }
  }

  if (r.bookByDate) {
    if (daysBetween(today, r.bookByDate) >= 0) {
      const lead = r.recommendedBookingTime ? `${r.recommendedBookingTime} — ` : "";
      out.push(`${lead}book by ${formatBookingDate(r.bookByDate)}.`);
    } else if (r.status === "required") {
      out.push("The recommended booking window has already passed — book as soon as you can.");
    }
  }

  if (r.bookingDeadline && daysBetween(today, r.bookingDeadline) >= 0) {
    out.push(`Booking closes ${formatBookingDate(r.bookingDeadline)}.`);
  }

  if (!r.walkInAvailable) out.push("No tickets are sold at the door.");
  else if (r.status === "recommended") {
    out.push("Walk-ins are available but waiting times may be long.");
  }

  return out;
}

/**
 * Resolve one activity's booking requirements for the date it is scheduled on.
 *
 * Flags and priority are derived from `status` rather than stored, so the curated data
 * cannot contradict itself. `today` is injected so date-sensitive output is testable.
 */
export function resolveBooking(
  place: Place,
  visitDate: Date,
  today: Date = new Date()
): ResolvedBooking {
  const meta = reservationMeta(place.id) ?? FALLBACK;
  const { status } = meta;

  const openDate = meta.opens ? resolveOpenDate(meta.opens, visitDate) : null;
  const rawBookBy =
    meta.bookByDaysBefore === undefined ? null : shiftDays(visitDate, meta.bookByDaysBefore);
  // A long recommended lead time can reach back past the day tickets go on sale — the
  // Ghibli Museum's 45-day advice lands before its "10th of the previous month" release.
  // Advising a date when booking is impossible is worse than useless, so never advise
  // a date earlier than the window actually opens.
  const bookByDate =
    rawBookBy && openDate && rawBookBy.getTime() < openDate.getTime() ? openDate : rawBookBy;

  const base: Omit<ResolvedBooking, "notices"> = {
    place,
    visitDate: atMidnight(visitDate),
    status,
    reservationRequired: status === "required",
    advanceTicketRequired: meta.advanceTicket,
    walkInAvailable: meta.walkIn ?? status !== "required",
    timeSlotRequired: meta.timeSlot ?? false,
    sellsOut: meta.sellsOut ?? false,
    recommendedBookingTime: meta.recommendedBookingTime ?? null,
    bookingOpenDate: openDate,
    bookingDeadline:
      meta.closesDaysBefore === undefined ? null : shiftDays(visitDate, meta.closesDaysBefore),
    bookByDate,
    officialBookingUrl: meta.officialBookingUrl ?? null,
    ticketPrice: meta.ticketPrice ?? null,
    openingHours: placeHours(place.id),
    estimatedVisitDuration: durationRangeFor(place),
    notes: meta.notes ?? null,
    bookingPriority:
      status === "required" || meta.sellsOut ? "high" : status === "recommended" ? "medium" : "low",
  };

  return { ...base, notices: buildNotices(base, meta, today) };
}

export type ChecklistItem = {
  booking: ResolvedBooking;
  /** Imperative summary of what the traveler has to do. */
  action: string;
};

const PRIORITY_RANK: Record<BookingPriority, number> = { high: 0, medium: 1, low: 2 };

function actionFor(b: ResolvedBooking): string {
  if (b.status === "required") {
    if (b.advanceTicketRequired && b.timeSlotRequired) {
      return "Reserve a time slot and buy tickets in advance";
    }
    if (b.advanceTicketRequired) return "Purchase tickets in advance";
    return "Book before your trip";
  }
  if (b.advanceTicketRequired) return "Buy tickets ahead to save time and money";
  if (b.timeSlotRequired) return "Reserve a time slot if you can";
  return "Consider reserving ahead";
}

/**
 * The "Things to Book Before Your Trip" list: only activities that need action
 * (recommended or required), one row per place even when it spans several days —
 * dated to the earliest, since that is the day the booking must cover — ordered by
 * priority, then by when the visit falls.
 */
export function tripChecklist(days: Day[], today: Date = new Date()): ChecklistItem[] {
  const earliest = new Map<string, { place: Place; date: Date }>();
  for (const day of days) {
    for (const place of day.places) {
      const seen = earliest.get(place.id);
      if (!seen || day.date.getTime() < seen.date.getTime()) {
        earliest.set(place.id, { place, date: day.date });
      }
    }
  }

  return [...earliest.values()]
    .map(({ place, date }) => resolveBooking(place, date, today))
    .filter((b) => b.status !== "none")
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.bookingPriority] - PRIORITY_RANK[b.bookingPriority] ||
        a.visitDate.getTime() - b.visitDate.getTime() ||
        a.place.name.localeCompare(b.place.name)
    )
    .map((booking) => ({ booking, action: actionFor(booking) }));
}

/** Distinct itinerary places that need no booking at all, for checklist reassurance. */
export function noBookingNeededCount(days: Day[]): number {
  const ids = new Set(days.flatMap((d) => d.places.map((p) => p.id)));
  return [...ids].filter((id) => (reservationMeta(id)?.status ?? "none") === "none").length;
}
