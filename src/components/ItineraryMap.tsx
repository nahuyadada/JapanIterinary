"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Day } from "@/lib/itinerary";
import type { StayRecommendation } from "@/lib/lodging";
import { stayKey } from "@/lib/guide";
import type { StayLodging } from "@/lib/tripPayload";

const DAY_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

const numberIcon = (n: number, color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const lodgingIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:#fff;color:${color};border-radius:8px 8px 8px 0;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid ${color};box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg)"><span style="transform:rotate(45deg)">🛏️</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });

export default function ItineraryMap({
  days,
  stayRecommendations = [],
  lodging = {},
}: {
  days: Day[];
  stayRecommendations?: StayRecommendation[];
  /** The traveler's own accommodation per stay, keyed by stayKey(region, firstDayIndex). */
  lodging?: Record<string, StayLodging>;
}) {
  const markers = days.flatMap((day) =>
    day.places
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({ place: p, dayIndex: day.dayIndex }))
  );

  /**
   * One pin per stay. The traveler's own accommodation wins over the recommended area when
   * it has coordinates — that is where they will actually wake up. A name-only
   * accommodation leaves the area's pin in place: there is nothing to move it to, and
   * guessing a position would be a fabrication.
   */
  const lodgingMarkers = stayRecommendations.flatMap((r) => {
    const dayIndex = r.stay.dayIndexes[0];
    const booked = lodging[stayKey(r.stay.region, dayIndex)];
    const region = r.stay.region;

    if (booked && booked.lat !== undefined && booked.lng !== undefined) {
      return [
        {
          key: `booked-${region}-${dayIndex}`,
          name: booked.name,
          lat: booked.lat,
          lng: booked.lng,
          dayIndex,
          region,
          booked: true,
        },
      ];
    }

    const area = r.areas[0];
    if (!area) return [];
    return [
      {
        key: `area-${area.id}-${dayIndex}`,
        name: area.name,
        lat: area.lat,
        lng: area.lng,
        dayIndex,
        region,
        booked: false,
      },
    ];
  });

  const center: [number, number] = markers.length
    ? [
        markers.reduce((a, m) => a + m.place.lat, 0) / markers.length,
        markers.reduce((a, m) => a + m.place.lng, 0) / markers.length,
      ]
    : [36.2048, 138.2529]; // Japan

  return (
    <MapContainer center={center} zoom={markers.length ? 6 : 5} className="h-72 sm:h-96 w-full rounded-xl z-0">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {markers.map(({ place, dayIndex }) => (
        <Marker
          key={`${place.id}-${dayIndex}`}
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
      {lodgingMarkers.map(({ key, name, lat, lng, dayIndex, region, booked }) => (
        <Marker
          key={key}
          position={[lat, lng]}
          icon={lodgingIcon(DAY_COLORS[dayIndex % DAY_COLORS.length])}
        >
          <Popup>
            <span className="font-semibold">
              {booked ? "Your stay: " : "Stay: "}
              {name}
            </span>
            <br />
            {region}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
