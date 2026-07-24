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
  lastInRow = false,
}: {
  place: Place;
  selected: boolean;
  onToggle: (id: string) => void;
  /** When this card sits in the last grid column, open the preview to the left to avoid clipping. */
  lastInRow?: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(place.imageUrl) && !imgError;

  // Flip the popover to the left edge of the card when it's in the rightmost column,
  // otherwise open it to the right as before.
  const popoverPosition = lastInRow ? "right-full mr-2" : "left-full ml-2";

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
            ? "border-red-500 bg-red-50 ring-2 ring-red-200"
            : "border-gray-200 bg-white hover:border-red-300 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-gray-900">{place.name}</span>
          <span
            className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
              selected ? "bg-red-500 border-red-500 text-white text-[11px]" : "border-gray-300"
            }`}
            aria-hidden
          >
            {selected ? "✓" : ""}
          </span>
        </div>
        <span className="text-xs text-gray-500">{place.city}</span>
        <span className="inline-block w-fit text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {CATEGORY_LABELS[place.category]}
        </span>
        <span className="text-sm text-gray-600 mt-1">{place.description}</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPreviewOpen((v) => !v);
        }}
        aria-label={`Preview ${place.name}`}
        aria-expanded={previewOpen}
        className="absolute top-2 right-9 w-5 h-5 rounded-full bg-white/90 border border-gray-300 text-[10px] font-semibold text-gray-500 flex items-center justify-center hover:border-red-300"
      >
        i
      </button>

      {previewOpen && (
        <div
          role="tooltip"
          className={`absolute z-40 top-0 ${popoverPosition} w-64 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden`}
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
            <div className="w-full h-32 flex items-center justify-center text-4xl bg-gradient-to-br from-red-100 to-pink-100">
              {CATEGORY_EMOJI[place.category]}
            </div>
          )}
          <div className="p-3 grid gap-1">
            <p className="font-semibold text-sm text-gray-900">{place.name}</p>
            {place.activities.length > 0 && (
              <ul className="list-disc list-inside text-xs text-gray-600 grid gap-0.5">
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
