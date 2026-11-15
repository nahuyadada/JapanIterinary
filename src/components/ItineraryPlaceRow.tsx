"use client";
import { useState } from "react";
import type { Place } from "@/data/places";
import { durationRangeFor, formatRange } from "@/lib/duration";
import { resolveBooking } from "@/lib/reservations";
import { directionsUrl, type TransportMode } from "@/lib/navigation";
import { thumbUrl } from "@/lib/image";
import BookingBadge from "@/components/BookingBadge";
import BookingCard from "@/components/BookingCard";
import { CATEGORY_EMOJI } from "@/components/PlaceCard";

const MODE_ICON: Record<TransportMode, string> = { transit: "🚆", walking: "🚶", driving: "🚗" };

/**
 * One stop on a day's timeline: when you arrive, what it is, and the controls to move or
 * drop it. Booking details stay behind "Details" so the day reads as a plan, not a form.
 */
export default function ItineraryPlaceRow({
  place,
  visitDate,
  dayIndex,
  dayCount,
  onRemove,
  onMove,
  pinned = false,
  time,
  travel,
}: {
  place: Place;
  visitDate: Date;
  dayIndex: number;
  dayCount: number;
  onRemove: (placeId: string) => void;
  onMove: (placeId: string, toDayIndex: number) => void;
  /** Locked to this date by the traveler; moving it re-plans the trip around the new date. */
  pinned?: boolean;
  /** Estimated arrival, "HH:MM", when the day has a schedule. */
  time?: string;
  /** The estimated hop that gets you here. */
  travel?: { minutes: number; mode: TransportMode; url: string };
}) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const booking = resolveBooking(place, visitDate);
  const target = { name: `${place.name}, ${place.city}`, lat: place.lat, lng: place.lng };
  const showImage = Boolean(place.imageUrl) && !imgError;

  return (
    <li className="px-3 sm:px-4">
      {travel && (
        <a
          href={travel.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open this hop in Google Maps"
          className="ml-[3.25rem] sm:ml-[4.25rem] my-1 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
        >
          <span aria-hidden className="h-4 border-l-2 border-dotted border-gray-300" />
          <span aria-hidden>{MODE_ICON[travel.mode]}</span>~{travel.minutes} min
        </a>
      )}

      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 basis-full sm:basis-64 pr-8 sm:pr-0">
          {time !== undefined && (
            <span className="shrink-0 w-10 sm:w-11 text-sm font-semibold tabular-nums text-gray-900">{time}</span>
          )}
          <span className="relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center text-xl">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbUrl(place.imageUrl!, 250)}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span aria-hidden>{CATEGORY_EMOJI[place.category] ?? "📍"}</span>
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-medium text-gray-900">{place.name}</p>
              {booking.status !== "none" && <BookingBadge status={booking.status} />}
              {pinned && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  📌 Fixed date
                </span>
              )}
              {place.customTime && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  ⏰ {place.customTime}
                </span>
              )}
              {place.isCustom && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Your spot
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {formatRange(durationRangeFor(place))} · {place.city}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 sm:shrink-0">
          <a
            href={directionsUrl(null, target)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2.5 sm:px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors font-medium"
          >
            Directions
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-full border font-medium transition-colors ${
              open
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600"
            }`}
          >
            Details
          </button>
          <select
            value={dayIndex}
            onChange={(e) => onMove(place.id, Number(e.target.value))}
            aria-label={`Move ${place.name} to another day`}
            title="Move to another day"
            className="border border-gray-300 rounded-full pl-2.5 pr-1 py-1.5 text-xs text-gray-700 bg-white hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-300"
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
            aria-label={`Remove ${place.name}`}
            title="Remove from trip"
            className="absolute top-2 right-0 sm:static w-8 h-8 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {open && (
        <div className="pb-3 sm:ml-[4.25rem]">
          <BookingCard booking={booking} />
        </div>
      )}
    </li>
  );
}
