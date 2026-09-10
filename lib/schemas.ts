import { z } from "zod";
import { KERALA_DISTRICTS } from "@/lib/kerala";

// Shared between client forms (react-hook-form-free: plain useActionState)
// and server actions - see the Next.js data-security guide: schema
// validation checks shape, not ownership/authorization, so every action
// using these still re-verifies the caller separately.

const DISTRICT_SLUGS = KERALA_DISTRICTS.map((d) => d.slug) as [string, ...string[]];

export const PROJECT_STATUSES = [
  "lead",
  "reported",
  "acknowledged",
  "work_resumed",
  "completed",
  "no_action",
] as const;

export const LOCAL_BODY_TYPES = ["panchayat", "municipality", "corporation", "other"] as const;
export const COST_NOTES = ["sanctioned", "revised_estimate"] as const;

// Empty-string-tolerant optional text: HTML forms submit "" for untouched
// optional fields, not undefined.
const optionalText = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalUrl = z
  .union([z.url({ error: "Enter a valid URL." }), z.literal("")])
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalDate = z
  .union([z.iso.date({ error: "Use YYYY-MM-DD." }), z.literal("")])
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalLatitude = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().min(-90).max(90).optional(),
);

const optionalLongitude = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().min(-180).max(180).optional(),
);

const coordinatesArePaired = (data: { latitude?: number; longitude?: number }) =>
  (data.latitude == null) === (data.longitude == null);

// ---------------------------------------------------------------------
// Public submission (/report)
// ---------------------------------------------------------------------

export const submissionSchema = z
  .object({
    // Honeypot: real visitors never fill this in (it's visually hidden).
    website: z.string().max(0, { error: "" }).optional().default(""),

    name_en: z.string().trim().min(3, { error: "Give the project a short name." }).max(200),
    description_en: optionalText,
    district: z.enum(DISTRICT_SLUGS, { error: "Choose a district." }),
    local_body: optionalText,
    maps_url: optionalUrl,
    latitude: optionalLatitude,
    longitude: optionalLongitude,
    department: optionalText,

    submitter_name: optionalText,
    submitter_email: z.union([z.email({ error: "Enter a valid email." }), z.literal("")]).optional(),
    submitter_phone: optionalText,
    submitter_note: optionalText,
  })
  .refine((data) => Boolean(data.submitter_email) || Boolean(data.submitter_phone), {
    error: "Leave an email or phone number so he can reach you about this.",
    path: ["submitter_email"],
  })
  .refine(coordinatesArePaired, {
    error: "Choose both latitude and longitude, or leave the location blank.",
    path: ["latitude"],
  });

export type SubmissionInput = z.infer<typeof submissionSchema>;

// ---------------------------------------------------------------------
// Admin: project editor
// ---------------------------------------------------------------------

export const projectEditSchema = z.object({
  name_en: z.string().trim().min(1, { error: "English name is required." }).max(200),
  name_ml: optionalText,
  description_en: optionalText,
  description_ml: optionalText,

  district: z.enum(DISTRICT_SLUGS, { error: "Choose a district." }),
  local_body: optionalText,
  local_body_type: z.enum(LOCAL_BODY_TYPES).optional(),
  latitude: optionalLatitude,
  longitude: optionalLongitude,

  cost_inr: z.coerce.number().min(0).optional(),
  cost_note: z.enum(COST_NOTES).optional(),
  tenure: optionalText,
  inaugurated_on: optionalDate,
  promised_completion_on: optionalDate,
  department: optionalText,

  status: z.enum(PROJECT_STATUSES),
  reported_on: optionalDate,
  resolved_on: optionalDate,

  instagram_url: optionalUrl,
  youtube_url: optionalUrl,

  is_published: z.coerce.boolean().default(false),
}).refine(coordinatesArePaired, {
  error: "Choose both latitude and longitude, or leave the location blank.",
  path: ["latitude"],
});

export type ProjectEditInput = z.infer<typeof projectEditSchema>;

// ---------------------------------------------------------------------
// Admin: timeline entries
// ---------------------------------------------------------------------

export const timelineEntrySchema = z.object({
  happened_on: z.iso.date({ error: "Use YYYY-MM-DD." }),
  title_en: z.string().trim().min(1, { error: "Title is required." }).max(200),
  title_ml: optionalText,
  body_en: optionalText,
  body_ml: optionalText,
  status_after: z.enum(PROJECT_STATUSES).optional(),
  source_url: optionalUrl,
});

export type TimelineEntryInput = z.infer<typeof timelineEntrySchema>;

// ---------------------------------------------------------------------
// Admin: queue moderation
// ---------------------------------------------------------------------

export const rejectSubmissionSchema = z.object({
  project_id: z.uuid(),
  reason: z.string().trim().min(1, { error: "Give a reason." }).max(1000),
});

// ---------------------------------------------------------------------
// Admin: site settings
// ---------------------------------------------------------------------

export const siteSettingsSchema = z.object({
  support_enabled: z.coerce.boolean().default(false),
  support_title_en: optionalText,
  support_title_ml: optionalText,
  support_body_en: optionalText,
  support_body_ml: optionalText,
  support_email: z.union([z.email(), z.literal("")]).optional(),
  support_phone: optionalText,
  support_upi_id: optionalText,
  support_link_url: optionalUrl,
  support_link_label_en: optionalText,
  support_link_label_ml: optionalText,
  instagram_url: optionalUrl,
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
