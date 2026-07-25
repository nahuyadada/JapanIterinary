"use client";
import type { Day } from "@/lib/itinerary";
import { formatHours, dayEstimate } from "@/lib/duration";
import ItineraryPlaceRow from "@/components/ItineraryPlaceRow";

const DAY_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

const VERDICT = {
  light: { label: "Free time left", cls: "text-green-600 dark:text-green-400" },
  full: { label: "Full day", cls: "text-amber-600 dark:text-amber-400" },
  packed: { label: "Overbooked", cls: "text-red-600 dark:text-red-400" },
} as const;

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
  const est = dayEstimate(day);

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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {dateLabel}
            {day.places.length > 0 && (
              <>
                {" · Est. "}
                {formatHours(est.minHours)}–{formatHours(est.maxHours)}h{" · "}
                <span className={VERDICT[est.verdict].cls}>{VERDICT[est.verdict].label}</span>
              </>
            )}
          </p>
        </div>
      </header>
      {day.places.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500">No places yet - move one here or pick more at the start.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
          {day.places.map((place) => (
            <ItineraryPlaceRow
              key={place.id}
              place={place}
              visitDate={day.date}
              dayIndex={day.dayIndex}
              dayCount={dayCount}
              onRemove={onRemove}
              onMove={onMove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
