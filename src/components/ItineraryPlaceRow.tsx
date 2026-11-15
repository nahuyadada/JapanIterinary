"use client";
import { useState } from "react";
import type { Place } from "@/data/places";
import { durationRangeFor, formatRange } from "@/lib/duration";
import { resolveBooking } from "@/lib/reservations";
import { directionsUrl, type TransportMode } from "@/lib/navigation";
import { thumbUrl } from "@/lib/image";
import BookingBadge from "@/components/BookingBadge";
import BookingCard from "@/components/BookingCard";
import { CATEGORY_ICON } from "@/components/PlaceCard";
import Icon, { type IconName } from "@/components/Icon";

const MODE_ICON: Record<TransportMode, IconName> = { transit: "train", walking: "walk", driving: "car" };

function formatTravel(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
}

const control =
  "inline-flex items-center min-h-9 sm:min-h-0 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border font-medium transition-colors";

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
          <Icon name={MODE_ICON[travel.mode]} className="w-3.5 h-3.5" />
          {formatTravel(travel.minutes)}
        </a>
      )}

      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 basis-full sm:basis-64 pr-8 sm:pr-0">
          {time !== undefined && (
            <span className="shrink-0 w-10 sm:w-11 text-sm font-semibold tabular-nums text-gray-900">{time}</span>
          )}
          <span className="relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 text-gray-400 flex items-center justify-center">
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
              <Icon name={CATEGORY_ICON[place.category] ?? "pin"} className="w-5 h-5" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-medium text-gray-900">{place.name}</p>
              {booking.status !== "none" && <BookingBadge status={booking.status} />}
              {pinned && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-300">
                  <Icon name="lock" className="w-3 h-3" />
                  Fixed date
                </span>
              )}
              {place.customTime && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Icon name="clock" className="w-3 h-3" />
                  {place.customTime}
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
            className={`${control} border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900`}
          >
            Directions
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={`${control} ${
              open
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900"
            }`}
          >
            Details
          </button>
          <select
            value={dayIndex}
            onChange={(e) => onMove(place.id, Number(e.target.value))}
            aria-label={`Move ${place.name} to another day`}
            title="Move to another day"
            className="min-h-9 sm:min-h-0 border border-gray-300 rounded-lg pl-2.5 pr-1 py-1.5 text-xs text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            {Array.from({ length: dayCount }, (_, i) => (
              <option key={i} value={i}>
                {i === dayIndex ? `Day ${i + 1}` : `Move to day ${i + 1}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onRemove(place.id)}
            aria-label={`Remove ${place.name}`}
            title="Remove from trip"
            className="absolute top-2 right-0 sm:static w-9 h-9 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Icon name="x" />
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
