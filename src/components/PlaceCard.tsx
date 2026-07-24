"use client";
import { useState } from "react";
import type { Place } from "@/data/places";
import { CATEGORY_LABELS } from "@/data/places";

const CATEGORY_EMOJI: Record<Place["category"], string> = {
  "temple-shrine": "⛩",
  scenic: "🏞",
  food: "🍜",
  nightlife: "🌃",
  activity: "🎢",
  shopping: "🛍",
  nature: "🌲",
  landmark: "🗼",
};

export default function PlaceCard({
  place,
  selected,
  onToggle,
}: {
  place: Place;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(place.imageUrl) && !imgError;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPreviewOpen(true)}
      onMouseLeave={() => setPreviewOpen(false)}
    >
      <button
        type="button"
        onClick={() => onToggle(place.id)}
        aria-pressed={selected}
        className={`text-left p-4 border rounded-xl transition h-full w-full flex flex-col gap-1 ${
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

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPreviewOpen((v) => !v);
        }}
        aria-label={`Preview ${place.name}`}
        aria-expanded={previewOpen}
        className="absolute top-2 right-9 w-5 h-5 rounded-full bg-white/90 dark:bg-neutral-800/90 border border-gray-300 dark:border-neutral-600 text-[10px] font-semibold text-gray-500 dark:text-gray-300 flex items-center justify-center"
      >
        i
      </button>

      {previewOpen && (
        <div
          role="tooltip"
          className="absolute z-40 left-full top-0 ml-2 w-64 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden"
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={place.imageUrl}
              alt={place.name}
              className="w-full h-32 object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-32 flex items-center justify-center text-4xl bg-gradient-to-br from-rose-100 to-sky-100 dark:from-neutral-800 dark:to-neutral-700">
              {CATEGORY_EMOJI[place.category]}
            </div>
          )}
          <div className="p-3 grid gap-1">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{place.name}</p>
            {place.activities.length > 0 && (
              <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 grid gap-0.5">
                {place.activities.slice(0, 3).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
