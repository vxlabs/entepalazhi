"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/dict";

/**
 * Click-to-play poster instead of an eager iframe, so no YouTube JS/cookies
 * load on first paint - only once someone actually wants to watch.
 * youtube-nocookie.com keeps the deferred load itself privacy-respecting.
 */
export function YouTubeEmbed({ videoId, dict }: { videoId: string; dict: Dictionary }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={dict.detail.watch_youtube}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative aspect-video w-full max-w-2xl overflow-hidden rounded-xl border bg-black"
      aria-label={dict.detail.watch_youtube}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail, not an optimizable local asset */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-hover:scale-105">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
