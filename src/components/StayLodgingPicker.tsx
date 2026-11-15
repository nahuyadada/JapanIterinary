"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GeocodeResult } from "@/lib/geocode";
import type { StayLodging } from "@/lib/tripPayload";
import Icon from "@/components/Icon";

// Leaflet touches `window` on import, so the picker can only load in the browser. Mirrors
// how AddCustomLocationModal pulls in the same component.
const CustomLocationMapPicker = dynamic(() => import("@/components/CustomLocationMapPicker"), {
  ssr: false,
});

type Status = "idle" | "loading" | "error";

/**
 * Tell the app where you actually booked, for one stay.
 *
 * Searching happens on an explicit action — Enter or the button — never per keystroke. That
 * is partly Nominatim's usage policy and partly better UX: a hotel name is typed as a unit,
 * and search-as-you-type would fire a request per character for no benefit.
 */
export default function StayLodgingPicker({
  region,
  cityHint,
  value,
  onChange,
  defaultCenter,
}: {
  region: string;
  /** The city to show in the placeholder, so the traveler knows what we will search near. */
  cityHint?: string;
  value: StayLodging | null;
  onChange: (lodging: StayLodging | null) => void;
  /** Where a dropped pin starts — the stay's top recommended area, not mid-ocean. */
  defaultCenter: { lat: number; lng: number };
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [pinning, setPinning] = useState(false);
  const [pin, setPin] = useState(defaultCenter);
  const [preview, setPreview] = useState<GeocodeResult | null>(null);
  const [approximate, setApproximate] = useState(false);

  /**
   * Only the newest search may write results. Without this, a slow first request landing
   * after a fast second one would show candidates for the wrong query.
   */
  const latestSearch = useRef(0);

  function reset() {
    setEditing(false);
    setPinning(false);
    setPreview(null);
    setQuery("");
    setResults(null);
    setError(null);
    setStatus("idle");
  }

  function startEditing() {
    setEditing(true);
    setQuery(value?.name ?? "");
    setResults(null);
    setError(null);
    setStatus("idle");
    setPinning(false);
    setPreview(null);
    setPin(
      value?.lat !== undefined && value.lng !== undefined
        ? { lat: value.lat, lng: value.lng }
        : defaultCenter
    );
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) {
      setResults(null);
      setStatus("error");
      setError("Type at least three characters of the place's name.");
      return;
    }

    const ticket = ++latestSearch.current;
    setStatus("loading");
    setError(null);
    setResults(null);
    setPreview(null);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const body = (await response.json().catch(() => null)) as
        | { results?: GeocodeResult[]; approximate?: boolean; error?: string }
        | null;
      if (ticket !== latestSearch.current) return;

      if (!response.ok || !body || !Array.isArray(body.results)) {
        setStatus("error");
        setError(body?.error ?? "Could not look that up. Set the location on the map instead.");
        return;
      }
      setResults(body.results);
      setApproximate(body.approximate === true);
      setStatus("idle");
    } catch {
      if (ticket !== latestSearch.current) return;
      setStatus("error");
      setError("Could not look that up. Set the location on the map instead.");
    }
  }

  function showOnMap(result: GeocodeResult) {
    setPreview(result);
    setPinning(false);
    setPin({ lat: result.lat, lng: result.lng });
  }

  function confirmPreview() {
    if (!preview) return;
    const moved = pin.lat !== preview.lat || pin.lng !== preview.lng;
    onChange({
      name: preview.name,
      address: preview.address,
      lat: pin.lat,
      lng: pin.lng,
      source: moved ? "pinned" : "geocoded",
    });
    reset();
  }

  function confirmPin() {
    const name = query.trim() || value?.name?.trim();
    if (!name) {
      setStatus("error");
      setError("Give the place a name so you can recognise it later.");
      return;
    }
    // No reverse geocoding: the traveler's own name for the place is what gets shown.
    onChange({ name, lat: pin.lat, lng: pin.lng, source: "pinned" });
    reset();
  }

  // Resolved and not being edited: show what we have, and how we got it.
  if (value && !editing) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 grid gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              You&apos;re staying at
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100 break-words">{value.name}</p>
            {value.address && (
              <p className="text-xs text-gray-600 dark:text-gray-300 break-words">{value.address}</p>
            )}
            <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <Icon
                name={value.source === "geocoded" ? "pin" : value.source === "pinned" ? "crosshair" : "pencil"}
                className="w-3.5 h-3.5"
              />
              {value.source === "geocoded" && "Matched on the map. Directions start here."}
              {value.source === "pinned" && "Pin you placed. Directions start here."}
              {!value.source && "Name only. Google Maps will look it up for directions."}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={startEditing}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                reset();
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className="justify-self-start inline-flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg border border-dashed border-gray-400 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
      >
        <Icon name="plus" />
        I already booked a place in {region}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 grid gap-2.5">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          Where are you staying in {region}?
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          We&apos;ll start each day&apos;s directions from its door instead of the suggested area.
        </p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={120}
          placeholder={`e.g. a hotel or address in ${cityHint || region}`}
          aria-label={`Accommodation name in ${region}`}
          className="flex-1 min-w-0 border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 px-3.5 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
        >
          {status === "loading" ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p role="status" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {results !== null && results.length > 0 && (
        <ul className="grid gap-1 max-h-56 overflow-y-auto">
          {results.map((result) => (
            <li key={`${result.lat},${result.lng},${result.name}`}>
              <button
                type="button"
                onClick={() => showOnMap(result)}
                aria-pressed={preview === result}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                  preview === result
                    ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                    : "border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
                }`}
              >
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {result.name}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {result.address}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {results !== null && results.length > 0 && !preview && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {approximate
            ? "No exact match, so these are the closest places we found. Pick one to see it on the map, then drag the pin if it's off."
            : "Pick a result to see it on the map before you confirm."}
        </p>
      )}

      {preview && (
        <div className="grid gap-2">
          <CustomLocationMapPicker
            key={`${preview.lat},${preview.lng}`}
            lat={pin.lat}
            lng={pin.lng}
            zoom={17}
            onChange={(lat, lng) => setPin({ lat, lng })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={confirmPreview}
              className="px-3.5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
            >
              Yes, this is my place
            </button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(preview.address || preview.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Check on Google Maps ↗
            </a>
          </div>
        </div>
      )}

      {results !== null && results.length === 0 && (
        <p role="status" className="text-xs text-gray-600 dark:text-gray-300">
          No matches for that name. Small guesthouses often aren&apos;t on the map, so place a pin
          instead.
        </p>
      )}

      {pinning ? (
        <div className="grid gap-2">
          <CustomLocationMapPicker
            lat={pin.lat}
            lng={pin.lng}
            onChange={(lat, lng) => setPin({ lat, lng })}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmPin}
              className="px-3.5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
            >
              Use this location
            </button>
            <button
              type="button"
              onClick={() => setPinning(false)}
              className="px-3.5 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Back to search
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setPinning(true);
              setPreview(null);
              setError(null);
              setStatus("idle");
            }}
            className="text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Set location on map instead
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-gray-500 dark:text-gray-400 underline hover:no-underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
