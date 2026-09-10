"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { siteSettingsSchema } from "@/lib/schemas";

export type SettingsFormState = { status: "idle" | "success" | "error"; message?: string };

export async function updateSiteSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const actor = await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  // Checkbox inputs are absent from FormData when unchecked.
  raw.support_enabled = formData.has("support_enabled") ? "true" : "false";

  const parsed = siteSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }

  const data = parsed.data;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      support_enabled: data.support_enabled,
      support_title_en: data.support_title_en ?? null,
      support_title_ml: data.support_title_ml ?? null,
      support_body_en: data.support_body_en ?? null,
      support_body_ml: data.support_body_ml ?? null,
      support_email: data.support_email || null,
      support_phone: data.support_phone ?? null,
      support_upi_id: data.support_upi_id ?? null,
      support_link_url: data.support_link_url ?? null,
      support_link_label_en: data.support_link_label_en ?? null,
      support_link_label_ml: data.support_link_label_ml ?? null,
      instagram_url: data.instagram_url ?? null,
      updated_by: actor.email,
    })
    .eq("id", true);

  if (error) return { status: "error", message: "Could not save settings." };

  await writeAuditLog({
    actorEmail: actor.email,
    action: "update_site_settings",
    diff: { support_enabled: data.support_enabled, instagram_url: data.instagram_url ?? null },
  });

  // The point of this table: flips live with no redeploy. updateTag does
  // immediate invalidation with read-your-own-writes semantics (unlike
  // revalidateTag's stale-while-revalidate, which needs a cacheLife
  // profile and wouldn't apply within this same response) - invalidates
  // the cached read (lib/data/settings.ts) everywhere it's used:
  // header/footer link, /support itself, and the sitemap.
  updateTag("site-settings");
  revalidatePath("/admin/settings");
  for (const locale of ["en", "ml"]) {
    revalidatePath(`/${locale}/support`);
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/about`);
  }

  return { status: "success" };
}
