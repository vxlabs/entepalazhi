"use server";

import { parseMapsPin, type LatLng } from "@/lib/maps";

/** Client entry point for MapPinPicker's "paste a Google Maps link" field -
 * lib/maps.ts is server-only, so this thin action is what the client calls. */
export async function resolveMapsPinAction(url: string): Promise<LatLng | null> {
  return parseMapsPin(url);
}
