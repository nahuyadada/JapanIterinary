"use client";
import { useState } from "react";
import type { Place } from "@/data/places";
import { CATEGORY_LABELS } from "@/data/places";
import { thumbUrl } from "@/lib/image";
import Icon, { type IconName } from "@/components/Icon";

export const CATEGORY_ICON: Record<Place["category"], IconName> = {
  "temple-shrine": "temple-shrine",
  scenic: "scenic",
  food: "food",
  nightlife: "nightlife",
  activity: "activity",
  shopping: "shopping",
  nature: "nature",
  landmark: "landmark",
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
      // Mouse only: on touch a tap would open the preview over the next card. Touch uses "i".
      onPointerEnter={(e) => e.pointerType === "mouse" && setPreviewOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPreviewOpen(false)}
    >
      <button
        type="button"
        onClick={() => onToggle(place.id)}
        aria-pressed={selected}
        className={`text-left border rounded-xl transition h-full w-full flex overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
          selected
            ? "border-red-500 bg-red-50 ring-2 ring-red-200"
            : "border-gray-200 bg-white hover:border-red-300"
        }`}
      >
        <span className="relative shrink-0 w-24 sm:w-28 self-stretch min-h-[7rem] bg-gray-100 text-gray-400 flex items-center justify-center">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl(place.imageUrl!, 250)}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Icon name={CATEGORY_ICON[place.category]} className="w-8 h-8" />
          )}
          <span
            className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-sm ${
              selected ? "bg-red-500 border-white text-white" : "bg-white/85 border-white text-transparent"
            }`}
            aria-hidden
          >
            <Icon name="check" className="w-3.5 h-3.5" />
          </span>
        </span>
        <span className="min-w-0 flex-1 p-3 pr-9 flex flex-col gap-1">
          <span className="font-semibold text-gray-900 leading-snug">{place.name}</span>
          <span className="text-xs text-gray-500">
            {place.city} · {CATEGORY_LABELS[place.category]}
          </span>
          <span className="text-sm text-gray-600 line-clamp-2">{place.description}</span>
        </span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPreviewOpen((v) => !v);
        }}
        aria-label={`Preview ${place.name}`}
        aria-expanded={previewOpen}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-gray-300 text-[11px] font-semibold text-gray-500 flex items-center justify-center hover:border-red-300 hover:text-red-600"
      >
        i
      </button>

      {previewOpen && (
        <div
          role="tooltip"
          className="place-popover absolute z-40 w-64 rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden"
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl(place.imageUrl!, 500)}
              alt={place.name}
              className="w-full h-36 object-cover bg-gray-100"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-36 flex items-center justify-center bg-gray-100 text-gray-400">
              <Icon name={CATEGORY_ICON[place.category]} className="w-10 h-10" />
            </div>
          )}
          <div className="p-3 grid gap-1.5">
            <p className="font-semibold text-sm text-gray-900">{place.name}</p>
            <p className="text-xs text-gray-600">{place.description}</p>
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
