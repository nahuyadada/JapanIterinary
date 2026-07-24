"use client";
import type { Day } from "@/lib/itinerary";
import { CATEGORY_LABELS } from "@/data/places";

const DAY_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

export default function ItineraryDay({
  day,
  dayCount,
  onRemove,
  onMove,
}: {
  day: Day;
  dayCount: number;
  onRemove: (placeId: string) => void;
  onMove: (placeId: string, toDayIndex: number) => void;
}) {
  const color = DAY_COLORS[day.dayIndex % DAY_COLORS.length];
  const dateLabel = day.date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <span
          className="w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center"
          style={{ background: color }}
        >
          {day.dayIndex + 1}
        </span>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Day {day.dayIndex + 1}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{dateLabel}</p>
        </div>
      </header>
      {day.places.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500">No places yet - move one here or pick more at the start.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
          {day.places.map((place) => (
            <li key={place.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{place.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {place.city} - {CATEGORY_LABELS[place.category]}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="sr-only" htmlFor={`move-${day.dayIndex}-${place.id}`}>
                  Move {place.name} to another day
                </label>
                <select
                  id={`move-${day.dayIndex}-${place.id}`}
                  value={day.dayIndex}
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
