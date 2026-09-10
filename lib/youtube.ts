/** Extracts an 11-char YouTube video ID from watch/share/shorts URL forms.
 * Kept out of components/youtube-embed.tsx (a "use client" file) because a
 * Server Component - the project detail page - needs to call this too, and
 * a client-marked module's exports can't be invoked from server code. */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1) || null;
    if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] ?? null;
    if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] ?? null;
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}
