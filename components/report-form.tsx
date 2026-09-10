"use client";

import { useActionState, useState } from "react";
import { submitProject, type SubmitProjectState } from "@/actions/submit-project";
import { createPublicPhotoUploadUrl } from "@/actions/uploads";
import { PhotoUploader, type UploadedPhoto } from "@/components/photo-uploader";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KERALA_DISTRICTS } from "@/lib/kerala";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";

const initialState: SubmitProjectState = { status: "idle" };

export function ReportForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(submitProject, initialState);
  const [district, setDistrict] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  if (state.status === "success") {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold">{dict.report.success_title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{dict.report.success_body}</p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {/* Honeypot: hidden from sighted users via CSS, not `hidden`/display:none
          (some bots skip those), and out of the tab order + screen readers. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold">{dict.report.section_project}</legend>

        <div className="space-y-2">
          <Label htmlFor="name_en">{dict.report.field_name}</Label>
          <Input id="name_en" name="name_en" required />
          {errors.name_en && <p className="text-sm text-destructive">{errors.name_en}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description_en">{dict.report.field_description}</Label>
          <Textarea id="description_en" name="description_en" rows={4} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">{dict.report.field_district}</Label>
          <input type="hidden" name="district" value={district} />
          <Select value={district} onValueChange={(v) => setDistrict(v ?? "")}>
            <SelectTrigger id="district" aria-label={dict.report.field_district}>
              <SelectValue placeholder={dict.report.district_placeholder} />
            </SelectTrigger>
            <SelectContent>
              {KERALA_DISTRICTS.map((d) => (
                <SelectItem key={d.slug} value={d.slug}>
                  {locale === "ml" ? d.ml : d.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.district && <p className="text-sm text-destructive">{errors.district}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="local_body">{dict.report.field_local_body}</Label>
          <Input id="local_body" name="local_body" />
        </div>

        <div className="space-y-2">
          <Label>{dict.report.field_location}</Label>
          <input type="hidden" name="latitude" value={latitude ?? ""} />
          <input type="hidden" name="longitude" value={longitude ?? ""} />
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(nextLatitude, nextLongitude) => { setLatitude(nextLatitude); setLongitude(nextLongitude); }}
            labels={dict.report.location_picker}
            mapsInputName="maps_url"
          />
          {errors.latitude && <p className="text-sm text-destructive">{errors.latitude}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">{dict.report.field_department}</Label>
          <Input id="department" name="department" />
        </div>

        <div className="space-y-2">
          <Label>{dict.report.field_photos}</Label>
          {photos.map((p) => (
            <input key={p.path} type="hidden" name="photo_paths" value={p.path} />
          ))}
          <PhotoUploader photos={photos} onChange={setPhotos} mintUploadUrl={createPublicPhotoUploadUrl} label={dict.report.field_photos} />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t pt-4">
        <legend className="mb-1 text-sm font-semibold">{dict.report.section_contact}</legend>
        <p className="text-xs text-muted-foreground">{dict.report.contact_hint}</p>

        <div className="space-y-2">
          <Label htmlFor="submitter_name">{dict.report.field_submitter_name}</Label>
          <Input id="submitter_name" name="submitter_name" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="submitter_email">{dict.report.field_submitter_email}</Label>
            <Input id="submitter_email" name="submitter_email" type="email" />
            {errors.submitter_email && <p className="text-sm text-destructive">{errors.submitter_email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="submitter_phone">{dict.report.field_submitter_phone}</Label>
            <Input id="submitter_phone" name="submitter_phone" type="tel" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="submitter_note">{dict.report.field_submitter_note}</Label>
          <Textarea id="submitter_note" name="submitter_note" rows={3} />
        </div>
      </fieldset>

      {state.status === "error" && !Object.keys(errors).length && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? dict.report.submitting : dict.report.submit}
      </Button>
    </form>
  );
}
