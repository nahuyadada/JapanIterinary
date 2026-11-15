"use client";
import { useState } from "react";
import type { Day } from "@/lib/itinerary";
import { bookingLinksForArea, type StayRecommendation } from "@/lib/lodging";
import { buildDaySchedule } from "@/lib/schedule";
import type { NavPoint, TransportMode } from "@/lib/navigation";
import type { StaySuggestion } from "@/lib/suggestions";
import ItineraryDay from "@/components/ItineraryDay";
import type { Ticketing } from "@/components/ItineraryPlaceRow";
import AddAttraction from "@/components/AddAttraction";
import StayLodgingPicker from "@/components/StayLodgingPicker";
import Icon from "@/components/Icon";
import type { StayLodging } from "@/lib/tripPayload";

import type { Place } from "@/data/places";

function fmt(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function CityPlan({
  rec,
  days,
  dayCount,
  adults,
  mode,
  suggestion,
  lodging,
  onLodging,
  onRemove,
  onMove,
  onAdd,
  onAddCustom,
  fixedDates,
  ticketing,
}: {
  rec: StayRecommendation;
  days: Day[];
  dayCount: number;
  adults: number;
  mode: TransportMode;
  suggestion: StaySuggestion | undefined;
  /** Where the traveler actually booked for this stay, or null when they haven't said. */
  lodging: StayLodging | null;
  onLodging: (lodging: StayLodging | null) => void;
  onRemove: (placeId: string) => void;
  onMove: (placeId: string, toDayIndex: number) => void;
  onAdd: (placeId: string) => void;
  onAddCustom?: (place: Place) => void;
  /** placeId → locked date, so pinned places can be marked. */
  fixedDates?: Record<string, string>;
  ticketing?: Ticketing;
}) {
  const [showAllAreas, setShowAllAreas] = useState(false);
  const { stay, areas } = rec;
  const top = areas[0];
  const areaOrigin: NavPoint | null = top
    ? { name: top.name, lat: top.lat, lng: top.lng }
    : null;

  /**
   * The schedule used to estimate its first leg from the recommended area even when the
   * traveler had told us where they were staying, which is why the wizard's schedule could
   * disagree with the guide's origin. A resolved accommodation now wins here too.
   *
   * A name-only accommodation cannot: `buildDaySchedule` needs coordinates to estimate a
   * leg, and inventing them is the fabrication this feature exists to avoid.
   */
  const origin: NavPoint | null =
    lodging && lodging.lat !== undefined && lodging.lng !== undefined
      ? { name: lodging.name, lat: lodging.lat, lng: lodging.lng }
      : areaOrigin;

  const firstDay = stay.dayIndexes[0] + 1;
  const lastDay = stay.dayIndexes[stay.dayIndexes.length - 1] + 1;
  const dayLabel = firstDay === lastDay ? `Day ${firstDay}` : `Days ${firstDay}–${lastDay}`;

  return (
    <section className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:p-5 bg-gray-50/60">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-xl font-semibold text-gray-900">{stay.region}</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600">
          {dayLabel}
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600">
          {stay.nights} night{stay.nights === 1 ? "" : "s"} · {fmt(stay.checkIn)} → {fmt(stay.checkOut)}
        </span>
      </header>

      {/* Once the traveler has told us where they booked, area suggestions are just noise. */}
      {!lodging && areas.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {(showAllAreas ? areas : areas.slice(0, 1)).map((area, i) => {
              const links = bookingLinksForArea(area, stay.checkIn, stay.checkOut, adults);
              return (
                <li key={area.id} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <Icon name="bed" className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="text-sm text-gray-500">
                      {i === 0 ? "Stay near" : "Or near"}{" "}
                      <span className="font-semibold text-gray-900">{area.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={`${area.blurb} ${area.goodFor}`}>
                      {area.blurb}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {links.map((link) => (
                      <a
                        key={link.provider}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors font-medium"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          {areas.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllAreas((v) => !v)}
              aria-expanded={showAllAreas}
              className="w-full flex items-center gap-1.5 text-left px-4 py-2 border-t border-gray-100 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Icon
                name="chevronDown"
                className={`w-3.5 h-3.5 transition-transform ${showAllAreas ? "rotate-180" : ""}`}
              />
              {showAllAreas
                ? "Show top pick only"
                : `Compare ${areas.length - 1} more area${areas.length === 2 ? "" : "s"}`}
            </button>
          )}
        </div>
      )}

      <StayLodgingPicker
        region={stay.region}
        cityHint={stay.places[0]?.city?.split(",").pop()?.trim()}
        value={lodging}
        onChange={onLodging}
        defaultCenter={
          areaOrigin
            ? { lat: areaOrigin.lat, lng: areaOrigin.lng }
            : // Nothing recommended for this stay, so start the pin over central Japan.
              { lat: 36.2048, lng: 138.2529 }
        }
      />

      {days.map((day) => (
        <ItineraryDay
          key={day.dayIndex}
          day={day}
          dayCount={dayCount}
          onRemove={onRemove}
          onMove={onMove}
          fixedDates={fixedDates}
          ticketing={ticketing}
          schedule={buildDaySchedule(day, origin, mode)}
        />
      ))}

      <AddAttraction group={suggestion} region={stay.region} onAdd={onAdd} onAddCustom={onAddCustom} />
    </section>
  );
}
