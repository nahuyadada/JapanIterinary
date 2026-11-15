"use client";
import { useMemo, useState } from "react";
import type { Day } from "@/lib/itinerary";
import {
  formatBookingDate,
  noBookingNeededCount,
  tripChecklist,
  type BookingPriority,
} from "@/lib/reservations";
import Icon from "@/components/Icon";

const PRIORITY: Record<BookingPriority, { label: string; cls: string }> = {
  high: { label: "Book first", cls: "bg-red-50 text-red-700 border-red-200" },
  medium: { label: "Book soon", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "Optional", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * What to book before the trip, as a to-do list. It opens as a one-line summary; each
 * item shows only what to do and by when, with the full reminders behind "More".
 *
 * Derived straight from `days`, so it re-computes whenever the itinerary changes.
 */
export default function TripChecklist({
  days,
  booked = {},
  times = {},
  defaultOpen = false,
}: {
  days: Day[];
  /** placeId -> date the traveler locked because they hold a ticket for it. */
  booked?: Record<string, string>;
  /** placeId -> "HH:MM" entry time on that ticket. */
  times?: Record<string, string>;
  defaultOpen?: boolean;
}) {
  const all = useMemo(() => tripChecklist(days), [days]);
  // Booked items sink to the bottom: what is left to do comes first.
  const items = useMemo(
    () => [...all.filter((i) => !booked[i.booking.place.id]), ...all.filter((i) => booked[i.booking.place.id])],
    [all, booked]
  );
  const toBook = items.filter((i) => !booked[i.booking.place.id]).length;
  const noneNeeded = useMemo(() => noBookingNeededCount(days), [days]);
  const [open, setOpen] = useState(defaultOpen);

  if (items.length === 0 && noneNeeded === 0) return null;

  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <Icon name="check" />
        Nothing to book ahead. Every place on this trip takes walk-ins.
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <Icon name="ticket" className="w-5 h-5 text-gray-500" />
        <span className="font-semibold text-gray-900">Book before you go</span>
        {toBook > 0 ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500 text-white">
            {toBook} to book
          </span>
        ) : (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            All booked
          </span>
        )}
        {items.length - toBook > 0 && toBook > 0 && (
          <span className="text-xs text-gray-500">{items.length - toBook} booked</span>
        )}
        {noneNeeded > 0 && <span className="text-xs text-gray-500">{noneNeeded} walk-in</span>}
        <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-gray-600">
          {open ? "Hide" : "Show"}
          <Icon name="chevronDown" className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <ol className="divide-y divide-gray-100 border-t border-gray-100">
          {items.map(({ booking, action }) => {
            const isBooked = Boolean(booked[booking.place.id]);
            const time = times[booking.place.id];
            return (
            <li key={booking.place.id} className="px-4 py-3 flex flex-wrap items-start gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 basis-64 grid gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-gray-900">{booking.place.name}</p>
                  {isBooked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                      <Icon name="check" className="w-3 h-3" />
                      Booked
                    </span>
                  ) : (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY[booking.bookingPriority].cls}`}
                    >
                      {PRIORITY[booking.bookingPriority].label}
                    </span>
                  )}
                </div>
                {isBooked ? (
                  <p className="text-sm text-gray-600">
                    Ticket for{" "}
                    <span className="font-medium text-gray-900">
                      {formatBookingDate(booking.visitDate)}
                      {time ? ` at ${time}` : ""}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    {action}
                    {booking.bookByDate && (
                      <>
                        {" · by "}
                        <span className="font-medium text-gray-900">{formatBookingDate(booking.bookByDate)}</span>
                      </>
                    )}
                    <span className="text-gray-400"> · visiting {shortDate(booking.visitDate)}</span>
                  </p>
                )}
                {booking.notices.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer list-none w-fit text-xs font-medium text-gray-500 hover:text-red-600">
                      <span className="group-open:hidden">More</span>
                      <span className="hidden group-open:inline">Less</span>
                    </summary>
                    <ul className="mt-1.5 grid gap-0.5 list-disc list-inside text-xs text-gray-500">
                      {booking.notices.map((notice) => (
                        <li key={notice}>{notice}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              {booking.officialBookingUrl && !isBooked && (
                <a
                  href={booking.officialBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-sm px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Book ↗
                </a>
              )}
            </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
