"use client";

import { InstagramEmbed } from "@/components/instagram-embed";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { extractYouTubeId } from "@/lib/youtube";
import { getDictionary } from "@/lib/i18n/dict";

const dict = getDictionary("en");

/**
 * Live render of whatever's currently in the Instagram/YouTube URL
 * fields, reusing the exact public-site embed components (InstagramEmbed
 * already falls back to a "Watch on Instagram" card rather than a blank
 * box - see that file's comment) so a dead or private link is caught here,
 * before publishing, not discovered on the live site.
 */
export function EmbedPreview({ instagramUrl, youtubeUrl }: { instagramUrl: string; youtubeUrl: string }) {
  const youtubeId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;

  if (!instagramUrl && !youtubeUrl) {
    return <p className="text-sm text-muted-foreground">Add an Instagram or YouTube URL to preview it here.</p>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {instagramUrl && (
        <div key={instagramUrl}>
          <InstagramEmbed url={instagramUrl} dict={dict} />
        </div>
      )}
      {youtubeUrl && (
        <div className="w-full max-w-sm">
          {youtubeId ? (
            <YouTubeEmbed videoId={youtubeId} dict={dict} />
          ) : (
            <p className="text-sm text-destructive">Could not read a video ID from that YouTube URL.</p>
          )}
        </div>
      )}
    </div>
  );
}
