"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// ssr:false is only valid for next/dynamic inside a Client Component, which
// is the whole reason this file exists as a thin wrapper around
// project-map-inner.tsx: Leaflet touches `window` at module load and would
// crash if the inner component were ever server-rendered.
const ProjectMapInner = dynamic(() => import("./project-map-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-xl" />,
});

export function ProjectMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return <ProjectMapInner lat={lat} lng={lng} label={label} />;
}
