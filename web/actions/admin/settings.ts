"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { NOW, execute } from "@/lib/db";
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
  try {
    await execute(
      `update site_settings set
         support_enabled = @support_enabled,
         support_title_en = @support_title_en,
         support_title_ml = @support_title_ml,
         support_body_en = @support_body_en,
         support_body_ml = @support_body_ml,
         support_email = @support_email,
         support_phone = @support_phone,
         support_upi_id = @support_upi_id,
         support_link_url = @support_link_url,
         support_link_label_en = @support_link_label_en,
         support_link_label_ml = @support_link_label_ml,
         instagram_url = @instagram_url,
         updated_by = @updated_by,
         updated_at = ${NOW}
       where id = 1`,
      {
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
      },
    );
  } catch (error) {
    console.error("updateSiteSettings failed:", error);
    return { status: "error", message: "Could not save settings." };
  }

  await writeAuditLog({
    actorEmail: actor.email,
    action: "update_site_settings",
    diff: { support_enabled: data.support_enabled, instagram_url: data.instagram_url ?? null },
  });

  // The point of this table: changes go live with no redeploy. updateTag
  // invalidates the cached read (lib/data/settings.ts) immediately,
  // everywhere it is used: header/footer link, /support, and the sitemap.
  updateTag("site-settings");
  revalidatePath("/admin/settings");
  for (const locale of ["en", "ml"]) {
    revalidatePath(`/${locale}/support`);
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/about`);
  }

  return { status: "success" };
}
