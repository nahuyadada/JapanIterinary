"use client";
import { CATEGORY_LABELS } from "@/data/places";
import { placeDuration } from "@/lib/itinerary";
import { placeHours } from "@/data/placeMeta";
import type { StaySuggestion } from "@/lib/suggestions";

export default function StaySuggestions({
  groups,
  onAdd,
}: {
  groups: StaySuggestion[];
  onAdd: (placeId: string) => void;
}) {
  const visible = groups.filter((g) => g.suggestions.length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="grid gap-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fill your free time</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nearby attractions that fit the open time in your schedule. Opening hours are typical
          estimates — verify before visiting.
        </p>
      </div>

      {visible.map((g) => {
        const firstDay = g.dayIndexes[0] + 1;
        const lastDay = g.dayIndexes[g.dayIndexes.length - 1] + 1;
        const dayLabel = firstDay === lastDay ? `Day ${firstDay}` : `Days ${firstDay}–${lastDay}`;

        return (
          <article
            key={`${g.region}-${g.dayIndexes[0]}`}
            className="border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden"
          >
            <header className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {dayLabel} · {g.region}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ≈ {Math.round(g.freeHours)}h free — consider adding:
              </p>
            </header>

            <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
              {g.suggestions.map((p) => (
                <li key={p.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {CATEGORY_LABELS[p.category]} · ~{placeDuration(p)}h · {placeHours(p.id)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{p.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd(p.id)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
