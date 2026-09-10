"use client";

import { LocationPicker, type LocationPickerLabels } from "@/components/location-picker";

const ADMIN_LABELS: LocationPickerLabels = {
  useCurrentLocation: "Use my current location",
  locating: "Finding your location...",
  locationHelp: "Your device asks for permission only after you press the button.",
  locationSelected: "Location selected. You can fine-tune it on the map.",
  clearLocation: "Clear location",
  mapHint: "Tap the map to place the pin, or drag the pin to adjust it.",
  mapsFallback: "Paste a Google Maps link instead",
  mapsUrlPlaceholder: "https://maps.google.com/...",
  useLink: "Use link",
  readingLink: "Reading...",
  mapsLinkError: "Could not read coordinates from that link. Place the pin on the map instead.",
  geolocationUnsupported: "This browser cannot provide your location. Place the pin on the map instead.",
  geolocationDenied: "Location permission was denied. Place the pin on the map instead.",
  geolocationUnavailable: "Your location is unavailable right now. Place the pin on the map instead.",
  geolocationTimeout: "Finding your location took too long. Place the pin on the map instead.",
  geolocationError: "Could not get your location. Place the pin on the map instead.",
};
export function MapPinPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
}) {
  return <LocationPicker latitude={latitude} longitude={longitude} onChange={onChange} labels={ADMIN_LABELS} showCoordinates />;
}
