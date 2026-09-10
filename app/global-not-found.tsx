import type { Metadata } from "next";
import "./globals.css";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";

export const metadata: Metadata = {
  title: "404 - Not found | Aarekettikkan",
  description: "The page you are looking for does not exist.",
};

/**
 * Catches URLs that match no route at all (garbage paths, wrong number of
 * segments). This bypasses the normal layout tree entirely - see
 * node_modules/next/dist/docs/.../not-found.md, "global-not-found.js" - so
 * it needs its own minimal HTML shell and can't reuse the [locale] header.
 * A within-app notFound() call (invalid slug, disabled /support) is instead
 * handled by app/[locale]/not-found.tsx, which keeps the site chrome.
 */
export default function GlobalNotFound() {
  const dict = getDictionary(DEFAULT_LOCALE);
  return (
    <html lang={DEFAULT_LOCALE}>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>{dict.not_found.title}</h1>
        <p style={{ marginTop: "0.5rem", color: "#666" }}>{dict.not_found.body}</p>
        <p style={{ marginTop: "1.5rem" }}>
          {/* This page bypasses the app shell entirely (see comment above), so a
              plain full-page navigation is correct here, not next/link routing. */}
          <a href={`/${DEFAULT_LOCALE}`} style={{ textDecoration: "underline" }}>
            {dict.not_found.home_link}
          </a>
        </p>
      </body>
    </html>
  );
}
