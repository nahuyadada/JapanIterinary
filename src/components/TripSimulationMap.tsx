"use client";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NavPoint } from "@/lib/navigation";
import type { HopSegment } from "@/lib/simulation";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/mapTiles";

const ACCENT = "#ef4444";
const MUTED = "#9ca3af";

const stopIcon = (label: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:#fff;color:#374151;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font:700 12px sans-serif;border:2px solid #9ca3af;box-shadow:0 1px 4px rgba(0,0,0,.35)">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const hereIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:${ACCENT};border:3px solid #fff;box-shadow:0 0 0 4px rgba(239,68,68,.3),0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitTo({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

export type MapStop = { point: NavPoint; label: string };

/**
 * The current day on a map: its base and stops, each journey drawn as straight lines
 * (dashed on foot, solid by train or car), and a dot where the traveler is right now.
 */
export default function TripSimulationMap({
  stops,
  hops,
  activeHop,
  here,
}: {
  stops: MapStop[];
  /** Every journey of the day, already split into walk and ride pieces. */
  hops: HopSegment[][];
  /** The journey that leads into the current step, if it has one. */
  activeHop: number | null;
  here: NavPoint | null;
}) {
  const focus = activeHop !== null ? hops[activeHop] : null;
  const fit: [number, number][] = focus
    ? focus.flatMap((s) => [
        [s.from.lat, s.from.lng] as [number, number],
        [s.to.lat, s.to.lng] as [number, number],
      ])
    : stops.map((s) => [s.point.lat, s.point.lng]);

  if (stops.length === 0) return null;

  return (
    <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 relative z-0">
      <MapContainer
        center={[stops[0].point.lat, stops[0].point.lng]}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <FitTo points={fit} />

        {hops.map((segments, hopIndex) =>
          segments.map((s, i) => {
            const active = hopIndex === activeHop;
            return (
              <Polyline
                key={`${hopIndex}-${i}-${active}`}
                positions={[
                  [s.from.lat, s.from.lng],
                  [s.to.lat, s.to.lng],
                ]}
                pathOptions={{
                  color: active ? (s.kind === "walk" ? "#374151" : ACCENT) : MUTED,
                  weight: active ? 5 : 3,
                  opacity: active ? 0.95 : 0.6,
                  dashArray: s.kind === "walk" ? "2 9" : undefined,
                }}
              />
            );
          })
        )}

        {focus
          ?.filter((s) => s.kind === "train")
          .flatMap((s) => [s.from, s.to])
          .map((station, i) => (
            <CircleMarker
              key={`${station.name}-${i}`}
              center={[station.lat, station.lng]}
              radius={6}
              pathOptions={{ color: ACCENT, weight: 3, fillColor: "#fff", fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top" offset={[0, -6]}>
                {station.name}
              </Tooltip>
            </CircleMarker>
          ))}

        {stops.map((stop) => (
          <Marker
            key={`${stop.label}-${stop.point.lat},${stop.point.lng}`}
            position={[stop.point.lat, stop.point.lng]}
            icon={stopIcon(stop.label)}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              {stop.point.name}
            </Tooltip>
          </Marker>
        ))}

        {here && <Marker position={[here.lat, here.lng]} icon={hereIcon} zIndexOffset={1000} />}
      </MapContainer>
    </div>
  );
}
