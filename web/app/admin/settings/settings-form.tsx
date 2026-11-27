"use client";

import { useActionState, useState } from "react";
import { updateSiteSettings, type SettingsFormState } from "@/actions/admin/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { SiteSettings } from "@/lib/types";

const initialState: SettingsFormState = { status: "idle" };

type TextSetting =
  | "support_title_en"
  | "support_title_ml"
  | "support_body_en"
  | "support_body_ml"
  | "support_email"
  | "support_phone"
  | "support_upi_id"
  | "support_link_url"
  | "support_link_label_en"
  | "support_link_label_ml"
  | "instagram_url";

function getTextSettings(settings: SiteSettings): Record<TextSetting, string> {
  return {
    support_title_en: settings.support_title_en ?? "",
    support_title_ml: settings.support_title_ml ?? "",
    support_body_en: settings.support_body_en ?? "",
    support_body_ml: settings.support_body_ml ?? "",
    support_email: settings.support_email ?? "",
    support_phone: settings.support_phone ?? "",
    support_upi_id: settings.support_upi_id ?? "",
    support_link_url: settings.support_link_url ?? "",
    support_link_label_en: settings.support_link_label_en ?? "",
    support_link_label_ml: settings.support_link_label_ml ?? "",
    instagram_url: settings.instagram_url ?? "",
  };
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState(updateSiteSettings, initialState);
  const [enabled, setEnabled] = useState(settings.support_enabled);
  const [values, setValues] = useState(() => getTextSettings(settings));

  // Server Actions can refresh this page with a newer settings row. Base UI
  // warns if an uncontrolled input's default changes in that situation, so
  // every text field is controlled from its first render.

  const onTextChange = (field: TextSetting) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <div className="flex items-center gap-3 rounded-md border p-3">
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          name="support_enabled"
        />
        <div>
          <p className="text-sm font-medium">Support page enabled</p>
          <p className="text-xs text-muted-foreground">
            While off, /support 404s and the link is hidden from nav, footer and the sitemap.
          </p>
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Title</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="support_title_en">English</Label>
            <Input id="support_title_en" name="support_title_en" value={values.support_title_en} onChange={onTextChange("support_title_en")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="support_title_ml">Malayalam</Label>
            <Input id="support_title_ml" name="support_title_ml" value={values.support_title_ml} onChange={onTextChange("support_title_ml")} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Body (plain text, rendered as paragraphs - never HTML)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="support_body_en">English</Label>
            <Textarea id="support_body_en" name="support_body_en" rows={6} value={values.support_body_en} onChange={onTextChange("support_body_en")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="support_body_ml">Malayalam</Label>
            <Textarea id="support_body_ml" name="support_body_ml" rows={6} value={values.support_body_ml} onChange={onTextChange("support_body_ml")} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Contact</legend>
        <div className="space-y-1">
          <Label htmlFor="support_email">Email</Label>
          <Input id="support_email" name="support_email" type="email" value={values.support_email} onChange={onTextChange("support_email")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="support_phone">Phone</Label>
          <Input id="support_phone" name="support_phone" value={values.support_phone} onChange={onTextChange("support_phone")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="support_upi_id">UPI ID (optional - displayed with a QR, not a payment integration)</Label>
          <Input id="support_upi_id" name="support_upi_id" value={values.support_upi_id} onChange={onTextChange("support_upi_id")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Extra link (optional)</legend>
        <div className="space-y-1">
          <Label htmlFor="support_link_url">URL</Label>
          <Input id="support_link_url" name="support_link_url" type="url" value={values.support_link_url} onChange={onTextChange("support_link_url")} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="support_link_label_en">Label (English)</Label>
            <Input id="support_link_label_en" name="support_link_label_en" value={values.support_link_label_en} onChange={onTextChange("support_link_label_en")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="support_link_label_ml">Label (Malayalam)</Label>
            <Input id="support_link_label_ml" name="support_link_label_ml" value={values.support_link_label_ml} onChange={onTextChange("support_link_label_ml")} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-1">
        <legend className="text-sm font-semibold">Social</legend>
        <Label htmlFor="instagram_url">Instagram profile URL</Label>
        <Input
          id="instagram_url"
          name="instagram_url"
          type="url"
          placeholder="https://www.instagram.com/your_account/"
          value={values.instagram_url}
          onChange={onTextChange("instagram_url")}
        />
        <p className="text-xs text-muted-foreground">
          Used for the Instagram links on the public site. Leave blank to hide them.
        </p>
      </fieldset>

      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save settings"}
        </Button>
        {state.status === "success" && <span className="text-sm text-muted-foreground">Saved - live now.</span>}
      </div>
    </form>
  );
}
