"use client";
import type { Place } from "@/data/places";
import { CATEGORY_LABELS } from "@/data/places";

export default function PlaceCard({
  place,
  selected,
  onToggle,
}: {
  place: Place;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(place.id)}
      aria-pressed={selected}
      className={`text-left p-4 border rounded-xl transition h-full flex flex-col gap-1 ${
        selected
          ? "border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-300 dark:ring-rose-800"
          : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-rose-300 dark:hover:border-rose-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-gray-900 dark:text-gray-100">{place.name}</span>
        <span
          className={`shrink-0 w-5 h-5 rounded-full border ${
            selected ? "bg-rose-500 border-rose-500" : "border-gray-300 dark:border-neutral-600"
          }`}
          aria-hidden
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{place.city}</span>
      <span className="inline-block w-fit text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300">
        {CATEGORY_LABELS[place.category]}
      </span>
      <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">{place.description}</span>
    </button>
  );
}
