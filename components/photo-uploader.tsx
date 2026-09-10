"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { X, Loader2, ImagePlus } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { SignedUploadResult } from "@/actions/uploads";

type UploadedPhoto = { path: string; previewUrl: string };

/**
 * Shared upload path for the public /report form and the admin editor's
 * Photos section, per the plan: client-side compression protects the 1GB
 * free-tier storage budget, then a PUT straight to a signed upload URL
 * bypasses this Next.js version's 1MB default Server Action body limit
 * (and Vercel's platform request-body cap) - both well under a phone
 * photo. `mintUploadUrl` is the only thing that differs between callers:
 * the public form mints into the private pending-photos bucket, the
 * admin editor mints straight into project-photos.
 */
export function PhotoUploader({
  photos,
  onChange,
  mintUploadUrl,
  maxPhotos = 6,
  label,
}: {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  mintUploadUrl: (fileName: string) => Promise<SignedUploadResult>;
  maxPhotos?: number;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setBusy(true);

    try {
      const supabase = createBrowserClient();
      const next = [...photos];

      for (const file of Array.from(fileList)) {
        if (next.length >= maxPhotos) break;

        const compressed = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
        });

        const { bucket, path, signedUrl, token } = await mintUploadUrl(file.name);
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .uploadToSignedUrl(path, token, compressed);
        if (uploadError) throw uploadError;
        void signedUrl;

        next.push({ path, previewUrl: URL.createObjectURL(compressed) });
      }

      onChange(next);
    } catch {
      setError("A photo failed to upload. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, i) => (
          <div key={photo.path} className="relative size-20 overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not a Next Image source */}
            <img src={photo.previewUrl} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-0.5 right-0.5 rounded-full bg-background/90 p-0.5"
              aria-label="Remove photo"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-muted/50">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span className="text-[10px]">{label}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export type { UploadedPhoto };
