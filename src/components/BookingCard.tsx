import { formatBookingDate, STATUS_DISPLAY, type ResolvedBooking } from "@/lib/reservations";
import { formatRange } from "@/lib/duration";
import BookingBadge from "@/components/BookingBadge";

function YesNo({ value }: { value: boolean }) {
  return (
    <span className={value ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}>
      {value ? "Yes" : "No"}
    </span>
  );
}

/** One label/value row of the card. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-2 py-1">
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

      {b.notices.length > 0 && (
        <ul className="grid gap-1">
          {b.notices.map((notice) => (
            <li
              key={notice}
              className="text-xs text-gray-700 dark:text-gray-200 flex gap-1.5 items-start"
            >
              <span aria-hidden="true" className="text-gray-400 dark:text-gray-500">
                •
              </span>
              {notice}
            </li>
          ))}
        </ul>
      )}

      <dl className="text-xs divide-y divide-gray-200 dark:divide-neutral-700">
        <Field label="Reservation required">
          <YesNo value={b.reservationRequired} />
        </Field>
        <Field label="Advance ticket required">
          <YesNo value={b.advanceTicketRequired} />
        </Field>
        <Field label="Walk-ins allowed">
          <YesNo value={b.walkInAvailable} />
        </Field>
        {b.timeSlotRequired && <Field label="Time slot">Entry is tied to a booked time slot</Field>}
        {b.recommendedBookingTime && (
          <Field label="Recommended booking time">{b.recommendedBookingTime}</Field>
        )}
        {b.bookingOpenDate && (
          <Field label="Booking opens">{formatBookingDate(b.bookingOpenDate)}</Field>
        )}
        {b.bookByDate && <Field label="Book by">{formatBookingDate(b.bookByDate)}</Field>}
        {b.bookingDeadline && (
          <Field label="Booking deadline">{formatBookingDate(b.bookingDeadline)}</Field>
        )}
        {b.ticketPrice && <Field label="Ticket price">{b.ticketPrice}</Field>}
        <Field label="Opening hours">{b.openingHours}</Field>
        <Field label="Estimated visit">{formatRange(b.estimatedVisitDuration)}</Field>
        {b.notes && <Field label="Notes">{b.notes}</Field>}
      </dl>

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
        Prices, hours, and booking windows are approximate and change — confirm on the official site
        before you book.
      </p>
    </div>
  );
}
