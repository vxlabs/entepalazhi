import "server-only";

export type LatLng = { latitude: number; longitude: number };

/**
 * Synchronous parse of the coordinate patterns a full (non-shortened)
 * Google Maps URL actually contains: `@lat,lng,zoom`, `?q=lat,lng`, or a
 * bare `lat,lng` query value. Covers most links pasted from "Share" on
 * desktop or a place page.
 */
function parseDirectMapsUrl(url: string): LatLng | null {
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };

  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { latitude: Number(qMatch[1]), longitude: Number(qMatch[2]) };

  const bareMatch = url.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
  if (bareMatch) return { latitude: Number(bareMatch[1]), longitude: Number(bareMatch[2]) };

  return null;
}

/**
 * Parses lat/lng out of a pasted Google Maps URL (whoever is
 * standing at the spot usually has one to hand). Short links
 * (maps.app.goo.gl, goo.gl/maps) don't carry coordinates in the URL
 * itself, so those are resolved with a HEAD-then-GET follow-redirect
 * fetch first. Returns null on any failure - MapPinPicker falls back to
 * click-and-drag on the Leaflet map rather than blocking on this.
 */
export async function parseMapsPin(rawUrl: string): Promise<LatLng | null> {
  const url = rawUrl.trim();
  if (!url) return null;

  const direct = parseDirectMapsUrl(url);
  if (direct) return direct;

  const isShortLink = /^(https?:\/\/)?(maps\.app\.goo\.gl|goo\.gl\/maps)\//.test(url);
  if (!isShortLink) return null;

  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(5000) });
    return parseDirectMapsUrl(response.url);
  } catch {
    return null;
  }
}
