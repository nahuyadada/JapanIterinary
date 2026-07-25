"use client";
import { directionsUrl, type DayRoute as DayRouteType, type TransportMode } from "@/lib/navigation";

const MODE_LABELS: Record<TransportMode, string> = {
  transit: "Transit",
  walking: "Walk",
  driving: "Drive",
};
const MODES: TransportMode[] = ["transit", "walking", "driving"];

export default function DayRoute({
  route,
  preferredMode,
}: {
  route: DayRouteType;
  preferredMode: TransportMode;
}) {
  if (route.legs.length === 0) return null;
  const others = MODES.filter((m) => m !== preferredMode);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50 p-4 grid gap-3">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Getting around</p>
      <ol className="grid gap-3">
        {route.legs.map((leg, i) => (
          <li key={i} className="grid gap-1.5">
            <div className="text-sm text-gray-800 dark:text-gray-100">
              <span className="font-medium">{leg.from.name}</span>
              <span className="text-gray-400"> → </span>
              <span className="font-medium">{leg.to.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ≈ {leg.straightLineKm.toFixed(1)} km direct
              </span>
              <a
                href={directionsUrl(leg.from, leg.to, preferredMode)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Directions · {MODE_LABELS[preferredMode]} ↗
              </a>
              {others.map((m) => (
                <a
                  key={m}
                  href={directionsUrl(leg.from, leg.to, m)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1.5 rounded-full border border-gray-300 dark:border-neutral-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {MODE_LABELS[m]} ↗
                </a>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        Distances are straight-line estimates. Real routes, times, and fares open in Google Maps.
      </p>
    </div>
  );
}
