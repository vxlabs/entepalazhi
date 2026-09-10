"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { StaticImageData } from "next/image";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's default marker icon resolves image paths relative to its own
// CSS, which breaks once bundled by Next.js/Turbopack. Rebuilding the icon
// from the bundler-resolved asset URLs is the standard fix.
//
// Next types every image import as StaticImageData, but Turbopack emits a
// plain URL string for assets imported out of node_modules, so read `.src`
// only when it's actually there.
const assetUrl = (asset: StaticImageData | string) =>
  typeof asset === "string" ? asset : asset.src;

const defaultIcon = L.icon({
  iconUrl: assetUrl(markerIcon),
  iconRetinaUrl: assetUrl(markerIcon2x),
  shadowUrl: assetUrl(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function ProjectMapInner({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="h-72 w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={defaultIcon}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  );
}
