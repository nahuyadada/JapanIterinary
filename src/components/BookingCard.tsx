import { formatBookingDate, STATUS_DISPLAY, type ResolvedBooking } from "@/lib/reservations";
import BookingBadge from "@/components/BookingBadge";

/** One label/value row of the card. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-2 py-1">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-gray-900 dark:text-gray-100">{children}</dd>
    </div>
  );
}

/**
 * The Booking Information Card for a single activity: what must be booked, by when,
 * where, and for how much. Fields with no curated value are omitted rather than shown
 * as "unknown", so the card only states things actually known.
 */
export default function BookingCard({ booking: b }: { booking: ResolvedBooking }) {
  return (
    <div className="grid gap-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50/70 dark:bg-neutral-800/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <BookingBadge status={b.status} />
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {STATUS_DISPLAY[b.status].blurb}
        </span>
      </div>

      <dl className="text-xs grid sm:grid-cols-2 gap-x-6">
        {b.bookByDate && <Field label="Book by">{formatBookingDate(b.bookByDate)}</Field>}
        {b.bookingOpenDate && (
          <Field label="Booking opens">{formatBookingDate(b.bookingOpenDate)}</Field>
        )}
        {b.bookingDeadline && (
          <Field label="Booking closes">{formatBookingDate(b.bookingDeadline)}</Field>
        )}
        {b.timeSlotRequired && <Field label="Entry">Timed slot</Field>}
        {b.ticketPrice && <Field label="Price">{b.ticketPrice}</Field>}
        <Field label="Hours">{b.openingHours}</Field>
      </dl>

      {b.notes && <p className="text-xs text-gray-600">{b.notes}</p>}

      {b.officialBookingUrl && (
        <a
          href={b.officialBookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="justify-self-start text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Book on the official site ↗
        </a>
      )}

      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        Approximate — confirm on the official site before you book.
      </p>
    </div>
  );
}
