"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Day } from "@/lib/itinerary";

const DAY_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

const numberIcon = (n: number, color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

export default function ItineraryMap({ days }: { days: Day[] }) {
  const markers = days.flatMap((day) =>
    day.places
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({ place: p, dayIndex: day.dayIndex }))
  );

  const center: [number, number] = markers.length
    ? [
        markers.reduce((a, m) => a + m.place.lat, 0) / markers.length,
        markers.reduce((a, m) => a + m.place.lng, 0) / markers.length,
      ]
    : [36.2048, 138.2529]; // Japan

  return (
    <MapContainer center={center} zoom={markers.length ? 6 : 5} className="h-72 sm:h-96 w-full rounded-xl z-0">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {markers.map(({ place, dayIndex }) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={numberIcon(dayIndex + 1, DAY_COLORS[dayIndex % DAY_COLORS.length])}
        >
          <Popup>
            <span className="font-semibold">{place.name}</span>
            <br />
            Day {dayIndex + 1}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
