"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { X, Loader2, ImagePlus } from "lucide-react";

type UploadedPhoto = { path: string; previewUrl: string };

export type PhotoUploaderLabels = { remove: string; uploadFailed: string };

const DEFAULT_LABELS: PhotoUploaderLabels = {
  remove: "Remove photo",
  uploadFailed: "A photo failed to upload. Check your connection and try again.",
};

/**
 * Shared by the public /report form and the admin editor's Photos section.
 * Each photo is shrunk in the browser first (keeps uploads small on mobile
 * data and the server's disk from filling up), then POSTed to `uploadUrl`:
 *   /api/uploads     public form  -> private pending folder
 *   /admin/uploads   admin editor -> public folder (pass `projectId`)
 * The server answers with the stored path, which the caller keeps.
 *
 * The shrink step redraws the picture on a canvas, so the original file's
 * metadata (camera GPS position, phone model) never leaves the phone; the
 * server strips it again when it re-encodes (lib/uploads.ts). The public
 * form's promise that the sender is never shown relies on that - do not
 * turn on `preserveExif`.
 */
export function PhotoUploader({
  photos,
  onChange,
  uploadUrl,
  projectId,
  maxPhotos = 6,
  label,
  labels = DEFAULT_LABELS,
  onBusyChange,
}: {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  uploadUrl: string;
  projectId?: string;
  maxPhotos?: number;
  label: string;
  labels?: PhotoUploaderLabels;
  /** Lets a form hold its send button while a photo is still uploading. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setBusy(true);
    onBusyChange?.(true);

    try {
      const next = [...photos];

      for (const file of Array.from(fileList)) {
        if (next.length >= maxPhotos) break;

        const compressed = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          // Send JPEG whatever the phone produced. An iPhone HEIC would
          // otherwise fall back to PNG, which can exceed the upload limit.
          fileType: "image/jpeg",
        });

        const body = new FormData();
        body.set("file", compressed, file.name);
        if (projectId) body.set("projectId", projectId);

        const response = await fetch(uploadUrl, { method: "POST", body });
        if (!response.ok) throw new Error("upload failed");
        const { path } = (await response.json()) as { path: string };

        next.push({ path, previewUrl: URL.createObjectURL(compressed) });
      }

      onChange(next);
    } catch {
      setError(labels.uploadFailed);
    } finally {
      setBusy(false);
      onBusyChange?.(false);
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
              aria-label={labels.remove}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-muted/50">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span className="px-1 text-center text-[10px] leading-tight">{label}</span>
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
