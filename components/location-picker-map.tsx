"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { StaticImageData } from "next/image";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const KERALA_CENTER: [number, number] = [10.35, 76.4];
const KERALA_ZOOM = 8;
const PIN_ZOOM = 15;

const assetUrl = (asset: StaticImageData | string) => (typeof asset === "string" ? asset : asset.src);

const isCoordinate = (value: number | null): value is number => typeof value === "number" && Number.isFinite(value);

const hasViewport = (map: L.Map) => {
  const size = map.getSize();
  return size.x > 0 && size.y > 0;
};

const defaultIcon = L.icon({
  iconUrl: assetUrl(markerIcon),
  iconRetinaUrl: assetUrl(markerIcon2x),
  shadowUrl: assetUrl(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewport({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  const map = useMap();

  // Leaflet measures its container on init and on window resize only, so a map
  // that mounts inside a collapsed <details> or an inactive tab stays 0x0 until
  // something makes it re-measure. Watching the element covers both the reopen
  // and the collapse, and stopping any running animation on collapse keeps a
  // flight from finishing its arithmetic against a zero size.
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      if (!hasViewport(map)) map.stop();
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (!isCoordinate(latitude) || !isCoordinate(longitude)) return;
    // flyTo interpolates against the viewport size, so on a hidden map it
    // divides by zero and throws "Invalid LatLng object: (NaN, NaN)". Jump
    // instead; the pin is already in view once the container gets a size.
    if (!hasViewport(map)) {
      map.setView([latitude, longitude], PIN_ZOOM, { animate: false });
      return;
    }
    map.flyTo([latitude, longitude], PIN_ZOOM, { duration: 0.35 });
  }, [latitude, longitude, map]);

  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const hasPin = isCoordinate(latitude) && isCoordinate(longitude);

  return (
    <MapContainer center={KERALA_CENTER} zoom={KERALA_ZOOM} scrollWheelZoom={false} className="h-64 w-full rounded-md">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport latitude={latitude} longitude={longitude} />
      <ClickHandler onPick={onChange} />
      {hasPin && (
        <Marker
          position={[latitude, longitude]}
          icon={defaultIcon}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target as L.Marker;
              const position = marker.getLatLng();
              onChange(position.lat, position.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
