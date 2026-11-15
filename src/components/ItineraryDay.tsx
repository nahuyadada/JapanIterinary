"use client";
import type { Day } from "@/lib/itinerary";
import { formatHours, dayEstimate } from "@/lib/duration";
import { formatClock, type ScheduleEntry } from "@/lib/schedule";
import ItineraryPlaceRow, { type Ticketing } from "@/components/ItineraryPlaceRow";

const DAY_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

const VERDICT = {
  light: { label: "Free time left", cls: "bg-green-50 text-green-700 border-green-200" },
  full: { label: "Full day", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  packed: { label: "Overbooked", cls: "bg-red-50 text-red-700 border-red-200" },
} as const;

/**
 * One day as a timeline. When a schedule is supplied, each stop shows its estimated
 * arrival time and the hop that reaches it, so the day plan and the place list are the
 * same list instead of two.
 */
export default function ItineraryDay({
  day,
  dayCount,
  onRemove,
  onMove,
  fixedDates,
  schedule = [],
  ticketing,
}: {
  day: Day;
  dayCount: number;
  onRemove: (placeId: string) => void;
  onMove: (placeId: string, toDayIndex: number) => void;
  fixedDates?: Record<string, string>;
  schedule?: ScheduleEntry[];
  ticketing?: Ticketing;
}) {
  const color = DAY_COLORS[day.dayIndex % DAY_COLORS.length];
  const dateLabel = day.date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const est = dayEstimate(day);

  // placeId -> its arrival time and the travel leg immediately before it.
  const timing = new Map<string, { time: string; travel?: Extract<ScheduleEntry, { kind: "travel" }> }>();
  schedule.forEach((entry, i) => {
    if (entry.kind !== "visit") return;
    const prev = schedule[i - 1];
    timing.set(entry.place.id, {
      time: formatClock(entry.time),
      travel: prev?.kind === "travel" ? prev : undefined,
    });
  });

  if (day.places.length === 0) {
    return (
      <section
        id={`day-${day.dayIndex + 1}`}
        className="scroll-mt-14 flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-xl bg-white"
      >
        <span
          className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
          style={{ background: color }}
        >
          {day.dayIndex + 1}
        </span>
        <h3 className="text-sm font-medium text-gray-700">
          Day {day.dayIndex + 1} <span className="font-normal text-gray-500">· {dateLabel}</span>
        </h3>
        <span className="ml-auto text-xs text-gray-400">Free day</span>
      </section>
    );
  }

  return (
    <section
      id={`day-${day.dayIndex + 1}`}
      className="scroll-mt-14 border border-gray-200 rounded-xl bg-white overflow-hidden"
    >
      <header className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100">
        <span
          className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center"
          style={{ background: color }}
        >
          {day.dayIndex + 1}
        </span>
        <h3 className="font-semibold text-gray-900">
          Day {day.dayIndex + 1} <span className="font-normal text-gray-500">· {dateLabel}</span>
        </h3>
        <span className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-gray-500">
            {formatHours(est.minHours)}–{formatHours(est.maxHours)}h
          </span>
          <span className={`px-2.5 py-1 rounded-full border font-medium ${VERDICT[est.verdict].cls}`}>
            {VERDICT[est.verdict].label}
          </span>
        </span>
      </header>
      <ul className="divide-y divide-gray-100">
        {day.places.map((place) => {
          const t = timing.get(place.id);
          return (
            <ItineraryPlaceRow
              key={place.id}
              place={place}
              visitDate={day.date}
              dayIndex={day.dayIndex}
              dayCount={dayCount}
              onRemove={onRemove}
              onMove={onMove}
              pinned={Boolean(fixedDates?.[place.id])}
                ticketing={ticketing}
              time={schedule.length > 0 ? (t?.time ?? "") : undefined}
              travel={t?.travel && { minutes: t.travel.minutes, mode: t.travel.mode, url: t.travel.url }}
            />
          );
        })}
      </ul>
    </section>
  );
}
