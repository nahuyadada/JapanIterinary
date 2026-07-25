"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="background:#ef4444;color:#fff;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4);cursor:grab">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function MapEventsAndMarker({
  position,
  onChange,
}: {
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onChange(latLng.lat, latLng.lng);
        }
      },
    }),
    [onChange]
  );

  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  // Pan map when position changes programmatically
  useEffect(() => {
    map.panTo(position);
  }, [position, map]);

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={pinIcon}
    />
  );
}

export default function CustomLocationMapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-48 w-full rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-xs text-gray-500">
        Loading map…
      </div>
    );
  }

  const position: [number, number] = [lat, lng];

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium flex items-center gap-1 text-gray-700 dark:text-gray-300">
          <span>🎯</span> Drag pin or click map to set exact location
        </span>
        <span className="font-mono text-[11px] bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-gray-200 dark:border-neutral-700">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
      <div className="h-52 w-full rounded-xl overflow-hidden border border-gray-300 dark:border-neutral-700 relative z-0">
        <MapContainer center={position} zoom={13} className="h-full w-full">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapEventsAndMarker position={position} onChange={onChange} />
        </MapContainer>
      </div>
    </div>
  );
}
