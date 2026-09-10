"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Crosshair, Link2, X } from "lucide-react";
import { resolveMapsPinAction } from "@/actions/maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const LocationPickerMap = dynamic(() => import("./location-picker-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-md" />,
});

const isCoordinate = (value: number | null): value is number => typeof value === "number" && Number.isFinite(value);

export type LocationPickerLabels = {
  useCurrentLocation: string;
  locating: string;
  locationHelp: string;
  locationSelected: string;
  clearLocation: string;
  mapHint: string;
  mapsFallback: string;
  mapsUrlPlaceholder: string;
  useLink: string;
  readingLink: string;
  mapsLinkError: string;
  geolocationUnsupported: string;
  geolocationDenied: string;
  geolocationUnavailable: string;
  geolocationTimeout: string;
  geolocationError: string;
};

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  labels,
  mapsInputName,
  showCoordinates = false,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number | null, longitude: number | null) => void;
  labels: LocationPickerLabels;
  mapsInputName?: string;
  showCoordinates?: boolean;
}) {
  const [mapsUrl, setMapsUrl] = useState("");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [readingLink, startReadingLink] = useTransition();
  const hasPin = isCoordinate(latitude) && isCoordinate(longitude);

  function handleCurrentLocation() {
    setLocationMessage(null);
    if (!("geolocation" in navigator)) {
      setLocationMessage(labels.geolocationUnsupported);
      return;
    }

    setLocating(true);
    setLocationMessage(labels.locating);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(position.coords.latitude, position.coords.longitude);
        setLocating(false);
        setLocationMessage(labels.locationSelected);
      },
      (error) => {
        const message = {
          [error.PERMISSION_DENIED]: labels.geolocationDenied,
          [error.POSITION_UNAVAILABLE]: labels.geolocationUnavailable,
          [error.TIMEOUT]: labels.geolocationTimeout,
        }[error.code];
        setLocating(false);
        setLocationMessage(message ?? labels.geolocationError);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function handleMapsLink() {
    setMapsError(null);
    startReadingLink(async () => {
      const pin = await resolveMapsPinAction(mapsUrl);
      if (pin) {
        onChange(pin.latitude, pin.longitude);
        setLocationMessage(labels.locationSelected);
      } else {
        setMapsError(labels.mapsLinkError);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={handleCurrentLocation} disabled={locating}>
          <Crosshair data-icon="inline-start" />
          {locating ? labels.locating : labels.useCurrentLocation}
        </Button>
        {hasPin && (
          <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(null, null); setLocationMessage(null); }}>
            <X data-icon="inline-start" />
            {labels.clearLocation}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{labels.locationHelp}</p>
      {locationMessage && <p className="text-sm" aria-live="polite">{locationMessage}</p>}
      <LocationPickerMap latitude={latitude} longitude={longitude} onChange={(nextLat, nextLng) => { onChange(nextLat, nextLng); setLocationMessage(labels.locationSelected); }} />
      <p className="text-xs text-muted-foreground">{labels.mapHint}</p>
      {showCoordinates && hasPin && <p className="text-xs text-muted-foreground">{latitude.toFixed(5)}, {longitude.toFixed(5)}</p>}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground underline-offset-4 hover:underline">{labels.mapsFallback}</summary>
        <div className="mt-2 flex gap-2">
          <Input
            value={mapsUrl}
            onChange={(event) => setMapsUrl(event.target.value)}
            name={mapsInputName}
            placeholder={labels.mapsUrlPlaceholder}
            type="url"
          />
          <Button type="button" variant="secondary" onClick={handleMapsLink} disabled={readingLink || !mapsUrl.trim()}>
            <Link2 data-icon="inline-start" />
            {readingLink ? labels.readingLink : labels.useLink}
          </Button>
        </div>
        {mapsError && <p className="mt-2 text-sm text-destructive" aria-live="polite">{mapsError}</p>}
      </details>
    </div>
  );
}
