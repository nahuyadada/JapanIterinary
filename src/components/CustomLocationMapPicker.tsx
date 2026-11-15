"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/mapTiles";
import L from "leaflet";
import Icon from "@/components/Icon";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="background:#ef4444;color:#fff;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4);cursor:grab"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></div>`,
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
          <Icon name="crosshair" className="w-3.5 h-3.5" />
          Drag the pin or click the map to set the exact location
        </span>
        <span className="font-mono text-[11px] bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-gray-200 dark:border-neutral-700">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
      <div className="h-52 w-full rounded-xl overflow-hidden border border-gray-300 dark:border-neutral-700 relative z-0">
        <MapContainer center={position} zoom={13} className="h-full w-full">
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <MapEventsAndMarker position={position} onChange={onChange} />
        </MapContainer>
      </div>
    </div>
  );
}
