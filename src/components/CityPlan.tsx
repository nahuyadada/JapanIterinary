"use client";
import type { Day } from "@/lib/itinerary";
import { bookingLinksForArea, type StayRecommendation } from "@/lib/lodging";
import { buildDaySchedule } from "@/lib/schedule";
import type { NavPoint, TransportMode } from "@/lib/navigation";
import type { StaySuggestion } from "@/lib/suggestions";
import ItineraryDay from "@/components/ItineraryDay";
import DaySchedule from "@/components/DaySchedule";
import AddAttraction from "@/components/AddAttraction";

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
  stayOrigin,
  onStayOrigin,
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
  /** Where the traveler is actually staying, as they typed it. Empty when unset. */
  stayOrigin: string;
  onStayOrigin: (value: string) => void;
  onRemove: (placeId: string) => void;
  onMove: (placeId: string, toDayIndex: number) => void;
  onAdd: (placeId: string) => void;
  onAddCustom?: (place: Place) => void;
}) {

  const { stay, areas } = rec;
  const top = areas[0];
  const origin: NavPoint | null = top ? { name: top.name, lat: top.lat, lng: top.lng } : null;

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

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-gray-800 dark:text-gray-100">
          Booked somewhere already?
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Name your hotel and the shared trip guide will give directions from its door instead
          of from the suggested area.
        </span>
        <input
          type="text"
          value={stayOrigin}
          onChange={(e) => onStayOrigin(e.target.value)}
          maxLength={120}
          placeholder={`e.g. a hotel or address in ${stay.region}`}
          className="mt-1 border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
        />
      </label>

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
