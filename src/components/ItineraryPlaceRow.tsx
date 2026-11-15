"use client";
import { useState } from "react";
import type { Place } from "@/data/places";
import { durationRangeFor, formatRange } from "@/lib/duration";
import { resolveBooking } from "@/lib/reservations";
import { directionsUrl, type TransportMode } from "@/lib/navigation";
import { thumbUrl } from "@/lib/image";
import { suggestAlternativeDays } from "@/lib/alternatives";
import { toISODate } from "@/lib/lodging";
import type { Day } from "@/lib/itinerary";
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

/** What a row needs to lock a ticketed place to its day, or move it when tickets are gone. */
export type Ticketing = {
  days: Day[];
  /** placeId -> local ISO dates the traveler found sold out. */
  soldOut: Record<string, string[]>;
  /** placeId -> "HH:MM" entry time on a ticket for a locked place. */
  times: Record<string, string>;
  onLock: (placeId: string, date: string | null) => void;
  onTime: (placeId: string, time: string | null) => void;
  onSoldOut: (placeId: string, date: string, soldOut: boolean) => void;
};

const FIT_NOTE = {
  same: (region: string) => `You're already in ${region} that day`,
  free: () => "Nothing else planned that day",
  other: (region: string) => `You're in ${region} that day`,
} as const;

function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

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
  ticketing,
  late,
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
  ticketing?: Ticketing;
  /** Estimated minutes past the ticket's entry time that the traveler arrives. */
  late?: number;
}) {
  const ticketTime = pinned ? ticketing?.times[place.id] : undefined;
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
                  {ticketTime ? `Ticket for ${ticketTime}` : "Fixed date"}
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
            {late !== undefined && ticketTime && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
                <Icon name="warning" className="w-3.5 h-3.5 shrink-0" />
                About {formatTravel(late).replace("~", "")} late for your {ticketTime} ticket. Move an
                earlier stop to another day.
              </p>
            )}
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
          {ticketing && booking.status !== "none" && (
            <TicketActions
              place={place}
              visitDate={visitDate}
              dayIndex={dayIndex}
              pinned={pinned}
              ticketing={ticketing}
              onMove={onMove}
            />
          )}
        </div>
      )}
    </li>
  );
}

const actionButton =
  "text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors";

function TicketActions({
  place,
  visitDate,
  dayIndex,
  pinned,
  ticketing,
  onMove,
}: {
  place: Place;
  visitDate: Date;
  dayIndex: number;
  pinned: boolean;
  ticketing: Ticketing;
  onMove: (placeId: string, toDayIndex: number) => void;
}) {
  const iso = toISODate(visitDate);
  const soldOutDates = ticketing.soldOut[place.id] ?? [];
  const soldOutToday = soldOutDates.includes(iso);

  if (pinned) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
        <p className="flex-1 basis-56 text-xs text-gray-700">
          <span className="font-semibold text-gray-900">Ticket locked to {fmtDay(visitDate)}.</span> The
          rest of the trip is planned around it.
        </p>
        <button type="button" onClick={() => ticketing.onLock(place.id, null)} className={actionButton}>
          Unlock
        </button>
        <div className="basis-full flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2.5">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            Entry time on your ticket
            <input
              type="time"
              value={ticketing.times[place.id] ?? ""}
              onChange={(e) => ticketing.onTime(place.id, e.target.value || null)}
              className="h-9 border border-gray-300 rounded-lg px-2 text-sm text-gray-900 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            />
          </label>
          {ticketing.times[place.id] ? (
            <button type="button" onClick={() => ticketing.onTime(place.id, null)} className={actionButton}>
              Clear time
            </button>
          ) : (
            <span className="text-xs text-gray-500">
              Optional. The day&apos;s stops are arranged so you arrive for this slot.
            </span>
          )}
        </div>
      </div>
    );
  }

  const options = soldOutToday ? suggestAlternativeDays(place, ticketing.days, dayIndex, soldOutDates) : [];

  return (
    <div className="mt-2 grid gap-2.5 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 basis-56 text-xs text-gray-600">
          {soldOutToday
            ? `Marked sold out for ${fmtDay(visitDate)}.`
            : `Tell us how booking went for ${fmtDay(visitDate)}.`}
        </p>
        {soldOutToday ? (
          <button type="button" onClick={() => ticketing.onSoldOut(place.id, iso, false)} className={actionButton}>
            Undo
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => ticketing.onLock(place.id, iso)}
              className="text-xs px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
            >
              I have my ticket, lock this day
            </button>
            <button type="button" onClick={() => ticketing.onSoldOut(place.id, iso, true)} className={actionButton}>
              Sold out on this day
            </button>
          </>
        )}
      </div>

      {soldOutToday &&
        (options.length === 0 ? (
          <p className="text-xs text-gray-600">
            No other day of the trip is left to try. Add a day or remove this place.
          </p>
        ) : (
          <div className="grid gap-1.5">
            <p className="text-xs font-semibold text-gray-900">Try another day</p>
            <ul className="grid gap-1.5">
              {options.map((o) => (
                <li
                  key={o.dayIndex}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 px-3 py-2"
                >
                  <div className="min-w-0 flex-1 basis-48 text-xs">
                    <p className="font-medium text-gray-900">
                      Day {o.dayIndex + 1} · {fmtDay(o.date)}
                    </p>
                    <p className={o.verdict === "packed" || o.fit === "other" ? "text-amber-700" : "text-gray-500"}>
                      {FIT_NOTE[o.fit](o.region ?? place.region)}
                      {o.verdict === "packed"
                        ? ", and it would be overbooked"
                        : o.verdict === "full"
                        ? ", making it a full day"
                        : ""}
                      .
                    </p>
                  </div>
                  <button type="button" onClick={() => onMove(place.id, o.dayIndex)} className={actionButton}>
                    Move here
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-gray-500">
              Check the booking site for that date first, then lock the day once you have the ticket.
            </p>
          </div>
        ))}
    </div>
  );
}
