"use client";
import { useMemo } from "react";
import type { Day } from "@/lib/itinerary";
import {
  noBookingNeededCount,
  tripChecklist,
  PRIORITY_LABELS,
  type BookingPriority,
} from "@/lib/reservations";
import BookingBadge from "@/components/BookingBadge";

const PRIORITY_CLASSES: Record<BookingPriority, string> = {
  high: "text-red-700 dark:text-red-400",
  medium: "text-amber-700 dark:text-amber-400",
  low: "text-gray-500 dark:text-gray-400",
};

function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * "Things to Book Before Your Trip" — the actionable subset of the itinerary. Places
 * that need nothing are counted rather than listed, so this stays a to-do list while
 * still confirming nothing was overlooked.
 *
 * Derived straight from `days`, so it re-computes whenever the itinerary changes.
 */
export default function TripChecklist({ days }: { days: Day[] }) {
  const items = useMemo(() => tripChecklist(days), [days]);
  const noneNeeded = useMemo(() => noBookingNeededCount(days), [days]);

  if (items.length === 0 && noneNeeded === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <header className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Things to Book Before Your Trip
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {items.length === 0
            ? "Nothing on this itinerary needs booking ahead."
            : `${items.length} ${
                items.length === 1 ? "place needs" : "places need"
              } a reservation or advance ticket.`}
        </p>
      </header>

      {items.length > 0 && (
        <ol className="divide-y divide-gray-100 dark:divide-neutral-800">
          {items.map(({ booking, action }) => (
            <li key={booking.place.id} className="px-4 py-3 grid gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <BookingBadge status={booking.status} />
                <p className="font-medium text-gray-900 dark:text-gray-100">{booking.place.name}</p>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Visiting {shortDate(booking.visitDate)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200">{action}</p>
              <p className={`text-xs font-medium ${PRIORITY_CLASSES[booking.bookingPriority]}`}>
                {PRIORITY_LABELS[booking.bookingPriority]}
              </p>
              {booking.notices.length > 0 && (
                <ul className="grid gap-0.5">
                  {booking.notices.map((notice) => (
                    <li key={notice} className="text-xs text-gray-500 dark:text-gray-400">
                      {notice}
                    </li>
                  ))}
                </ul>
              )}
              {booking.officialBookingUrl && (
                <a
                  href={booking.officialBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="justify-self-start text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Book on the official site ↗
                </a>
              )}
            </li>
          ))}
        </ol>
      )}

      {noneNeeded > 0 && (
        <p className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-neutral-800">
          <span aria-hidden="true">🟢</span> {noneNeeded} other{" "}
          {noneNeeded === 1 ? "place needs" : "places need"} no booking — walk in whenever you like.
        </p>
      )}
    </section>
  );
}
