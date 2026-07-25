"use client";
import type { Place } from "@/data/places";
import { CATEGORY_LABELS } from "@/data/places";
import { durationRangeFor, formatRange } from "@/lib/duration";
import { resolveBooking } from "@/lib/reservations";
import BookingBadge from "@/components/BookingBadge";
import BookingCard from "@/components/BookingCard";

/**
 * One place within a day: its details and day/remove controls, plus a disclosure for
 * its booking requirements. The badge is always visible so the day stays scannable;
 * the full card opens on demand.
 *
 * The disclosure is a native <details> — no state to manage, keyboard-accessible by
 * default, and it still works before hydration.
 */
export default function ItineraryPlaceRow({
  place,
  visitDate,
  dayIndex,
  dayCount,
  onRemove,
  onMove,
}: {
  place: Place;
  visitDate: Date;
  dayIndex: number;
  dayCount: number;
  onRemove: (placeId: string) => void;
  onMove: (placeId: string, toDayIndex: number) => void;
}) {
  const booking = resolveBooking(place, visitDate);

  return (
    <li className="px-4 py-3 grid gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-gray-100">{place.name}</p>
            <BookingBadge status={booking.status} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {place.city} - {CATEGORY_LABELS[place.category]}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Est. visit {formatRange(durationRangeFor(place))}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="sr-only" htmlFor={`move-${dayIndex}-${place.id}`}>
            Move {place.name} to another day
          </label>
          <select
            id={`move-${dayIndex}-${place.id}`}
            value={dayIndex}
            onChange={(e) => onMove(place.id, Number(e.target.value))}
            className="border border-gray-300 dark:border-neutral-600 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900"
          >
            {Array.from({ length: dayCount }, (_, i) => (
              <option key={i} value={i}>
                Day {i + 1}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onRemove(place.id)}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            aria-label={`Remove ${place.name}`}
          >
            Remove
          </button>
        </div>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 w-fit list-none flex items-center gap-1">
          <span aria-hidden="true" className="transition-transform group-open:rotate-90">
            ▸
          </span>
          <span className="group-open:hidden">Booking info</span>
          <span className="hidden group-open:inline">Hide booking info</span>
        </summary>
        <div className="pt-2">
          <BookingCard booking={booking} />
        </div>
      </details>
    </li>
  );
}
