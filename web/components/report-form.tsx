"use client";

import { useActionState, useState, type FormEvent } from "react";
import { submitProject, type SubmitProjectState } from "@/actions/submit-project";
import { PhotoUploader, type UploadedPhoto } from "@/components/photo-uploader";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WARDS } from "@/lib/directory";
import { WARD_UNKNOWN, type SubmissionError } from "@/lib/schemas";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";

const initialState: SubmitProjectState = { status: "idle" };

const MAX_PHOTOS = 3;

/** The fields that have a place on the form to show their own error. An
 * error on anything else is shown as the general message instead, so no
 * failure is ever silent. */
const SHOWN_FIELDS = ["name_en", "description_en", "photo_paths", "latitude", "longitude", "ward_no", "submitter_phone"];

/**
 * The public report form. Filled almost entirely on phones, often standing
 * at the spot, so it asks for five things about the issue and one optional
 * mobile number - nothing else.
 */
export function ReportForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(submitProject, initialState);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  // Photo and location cannot use the browser's own "required" check (they
  // are not ordinary inputs), so they are checked here before sending.
  const [missing, setMissing] = useState<{ photo?: boolean; location?: boolean }>({});

  const d = dict.report;

  if (state.status === "success") {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold">{d.success_title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{d.success_body}</p>
      </div>
    );
  }

  const serverErrors = state.fieldErrors ?? {};
  const text = (code: SubmissionError | undefined) => (code ? d.errors[code] : undefined);

  const errors = {
    name: text(serverErrors.name_en),
    description: text(serverErrors.description_en),
    photo: missing.photo ? d.errors.photo_missing : photos.length === 0 ? text(serverErrors.photo_paths) : undefined,
    location:
      missing.location
        ? d.errors.location_missing
        : latitude == null
          ? text(serverErrors.latitude ?? serverErrors.longitude)
          : undefined,
    ward: text(serverErrors.ward_no),
    phone: text(serverErrors.submitter_phone),
  };

  const hasUnshownError = Object.keys(serverErrors).some((key) => !SHOWN_FIELDS.includes(key));
  const generalError =
    state.status === "error" && (hasUnshownError || Object.keys(serverErrors).length === 0)
      ? text(state.message ?? "generic")
      : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const next = { photo: photos.length === 0, location: latitude == null || longitude == null };
    setMissing(next);
    if (next.photo || next.location) event.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot: hidden from sighted users via CSS, not `hidden`/display:none
          (some bots skip those), and out of the tab order + screen readers. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name_en">{d.field_name}</Label>
        <Input
          id="name_en"
          name="name_en"
          required
          minLength={3}
          maxLength={200}
          placeholder={d.name_placeholder}
          defaultValue={state.values?.name_en ?? ""}
          aria-invalid={errors.name ? true : undefined}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_en">{d.field_description}</Label>
        <Textarea
          id="description_en"
          name="description_en"
          rows={4}
          required
          maxLength={4000}
          defaultValue={state.values?.description_en ?? ""}
          aria-describedby="description_hint"
          aria-invalid={errors.description ? true : undefined}
        />
        <p id="description_hint" className="text-xs text-muted-foreground">{d.description_hint}</p>
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label>{d.field_photos}</Label>
        {photos.map((p) => (
          <input key={p.path} type="hidden" name="photo_paths" value={p.path} />
        ))}
        <PhotoUploader
          photos={photos}
          onChange={(next) => { setPhotos(next); if (next.length > 0) setMissing((m) => ({ ...m, photo: false })); }}
          onBusyChange={setUploading}
          uploadUrl="/api/uploads"
          maxPhotos={MAX_PHOTOS}
          label={d.add_photo}
          labels={d.photo_labels}
        />
        {errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
      </div>

      <div className="space-y-2">
        <Label>{d.field_location}</Label>
        <input type="hidden" name="latitude" value={latitude ?? ""} />
        <input type="hidden" name="longitude" value={longitude ?? ""} />
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(nextLatitude, nextLongitude) => {
            setLatitude(nextLatitude);
            setLongitude(nextLongitude);
            if (nextLatitude != null) setMissing((m) => ({ ...m, location: false }));
          }}
          labels={d.location_picker}
          mapVisibility="afterAttempt"
          showMapsLink={false}
        />
        {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ward_no">{d.field_ward}</Label>
        {/* A native select: the phone shows its own full-screen picker, which
            is easier to use for 25 choices than a custom dropdown. `key`
            re-applies the echoed value after an error. */}
        <select
          id="ward_no"
          name="ward_no"
          required
          key={state.values?.ward_no ?? ""}
          defaultValue={state.values?.ward_no ?? ""}
          aria-invalid={errors.ward ? true : undefined}
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm dark:bg-input/30"
        >
          <option value="" disabled>{d.ward_placeholder}</option>
          {WARDS.map((ward) => (
            <option key={ward.no} value={ward.no}>
              {ward.no} · {locale === "ml" ? ward.ml : ward.name}
            </option>
          ))}
          <option value={WARD_UNKNOWN}>{d.ward_unknown}</option>
        </select>
        {errors.ward && <p className="text-sm text-destructive">{errors.ward}</p>}
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="submitter_phone">{d.field_submitter_phone}</Label>
        <Input
          id="submitter_phone"
          name="submitter_phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          defaultValue={state.values?.submitter_phone ?? ""}
          aria-describedby="phone_hint"
          aria-invalid={errors.phone ? true : undefined}
        />
        <p id="phone_hint" className="text-xs text-muted-foreground">{d.phone_hint}</p>
        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
      </div>

      {generalError && <p className="text-sm text-destructive" role="alert">{generalError}</p>}

      <Button type="submit" disabled={pending || uploading} className="w-full sm:w-auto">
        {pending ? d.submitting : uploading ? d.photo_uploading : d.submit}
      </Button>
    </form>
  );
}
