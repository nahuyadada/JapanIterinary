"use client";
import type { Day } from "@/lib/itinerary";
import { bookingLinksForArea, type StayRecommendation } from "@/lib/lodging";
import { buildDaySchedule } from "@/lib/schedule";
import type { NavPoint, TransportMode } from "@/lib/navigation";
import type { StaySuggestion } from "@/lib/suggestions";
import ItineraryDay from "@/components/ItineraryDay";
import DaySchedule from "@/components/DaySchedule";
import AddAttraction from "@/components/AddAttraction";
import StayLodgingPicker from "@/components/StayLodgingPicker";
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
}) {

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
    <section className="grid gap-4 rounded-2xl border border-gray-200 dark:border-neutral-700 p-4 sm:p-5 bg-gray-50/60 dark:bg-neutral-900/30">
      <header>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{stay.region}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {dayLabel} · {stay.nights} night{stay.nights === 1 ? "" : "s"} · {fmt(stay.checkIn)} → {fmt(stay.checkOut)}
        </p>
      </header>

      {areas.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Where to stay in {stay.region}</h4>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
            {areas.map((area, i) => {
              const links = bookingLinksForArea(area, stay.checkIn, stay.checkOut, adults);
              return (
                <li key={area.id} className="px-4 py-3 grid gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {area.name}
                      {i === 0 && (
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                          Top pick
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{area.blurb}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{area.goodFor}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {links.map((link) => (
                      <a
                        key={link.provider}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
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
        <div key={day.dayIndex} className="grid gap-3">
          <ItineraryDay day={day} dayCount={dayCount} onRemove={onRemove} onMove={onMove} />
          <DaySchedule entries={buildDaySchedule(day, origin, mode)} />
        </div>
      ))}

      <AddAttraction group={suggestion} region={stay.region} onAdd={onAdd} onAddCustom={onAddCustom} />

    </section>
  );
}
