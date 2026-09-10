"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dict";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const SCRIPT_SRC = "https://www.instagram.com/embed.js";
const FALLBACK_TIMEOUT_MS = 3000;

/**
 * Instagram has no reliable bare <iframe src=".../embed"> - the supported
 * token-free path is the official blockquote.instagram-media + embed.js
 * script, which Instagram's own script converts into an iframe (Meta
 * restored token-free oEmbed in June 2026). That script can fail silently
 * (blocked, deleted post, private account), so this never just renders a
 * blank blockquote: if window.instgrm hasn't processed it within ~3s, it
 * swaps to a "Watch on Instagram" card instead. See the Phase 1 plan's
 * "Instagram embed" note for the sourcing on this.
 */
export function InstagramEmbed({ url, dict }: { url: string; dict: Dictionary }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setState((s) => (s === "loading" ? "failed" : s));
    }, FALLBACK_TIMEOUT_MS);

    function process() {
      window.instgrm?.Embeds.process();
      // embed.js swaps the blockquote for an iframe on success; detect
      // that swap rather than trusting the script ran without error.
      requestAnimationFrame(() => {
        const hasIframe = containerRef.current?.querySelector("iframe");
        if (!cancelled && hasIframe) setState("ok");
      });
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (window.instgrm) {
      process();
    } else if (existing) {
      existing.addEventListener("load", process, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.addEventListener("load", process, { once: true });
      script.addEventListener("error", () => {
        if (!cancelled) setState("failed");
      });
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [url]);

  if (state === "failed") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-square w-full max-w-md flex-col items-center justify-center gap-3 rounded-xl border bg-gradient-to-br from-fuchsia-50 to-amber-50 p-6 text-center transition hover:opacity-90 dark:from-fuchsia-950 dark:to-amber-950"
      >
        <InstagramGlyph />
        <span className="font-medium underline-offset-4 hover:underline">
          {dict.detail.watch_instagram}
        </span>
      </a>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-md">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ width: "100%" }}
      />
    </div>
  );
}

function InstagramGlyph() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}
