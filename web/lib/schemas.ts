import { z } from "zod";
import { PALAZHI_AREAS } from "@/lib/areas";
import { WARDS } from "@/lib/directory";

// Shared between client forms (react-hook-form-free: plain useActionState)
// and server actions - see the Next.js data-security guide: schema
// validation checks shape, not ownership/authorization, so every action
// using these still re-verifies the caller separately.

const AREA_SLUGS = PALAZHI_AREAS.map((d) => d.slug) as [string, ...string[]];

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

/** HTML forms send "" for an untouched select or number box. Treat that as
 * "not given" - otherwise an empty choice fails validation and an empty
 * cost is silently stored as 0. */
const blankToUndefined = (value: unknown) => (value === "" || value == null ? undefined : value);

/** Form booleans arrive as the strings "true"/"false". Boolean("false") is
 * true, so z.coerce.boolean() must not be used here: it would turn every
 * save of a draft into a publish. */
const formBoolean = z.preprocess(
  (value) => value === true || value === "true" || value === "on" || value === "1",
  z.boolean(),
);

/** Optional ward tag: blank means "not tagged"; otherwise one of the ward
 * numbers in lib/directory.ts. */
const optionalWard = z.preprocess(
  blankToUndefined,
  z.coerce
    .number()
    .int()
    .refine((no) => WARDS.some((w) => w.no === no), { error: "Choose a ward from the list." })
    .optional(),
);

const coordinatesArePaired = (data: { latitude?: number; longitude?: number }) =>
  (data.latitude == null) === (data.longitude == null);

// ---------------------------------------------------------------------
// Public submission (/report)
// ---------------------------------------------------------------------

/**
 * Error messages here are codes, not sentences: the form is bilingual, so it
 * looks each code up in the dictionary (report.errors) and shows it in the
 * reader's language.
 */
export const SUBMISSION_ERRORS = [
  "title_short",
  "title_long",
  "description_missing",
  "description_long",
  "photo_missing",
  "location_missing",
  "ward_missing",
  "phone_invalid",
  "rate_limited",
  "verification_failed",
  "save_failed",
  "generic",
] as const;

export type SubmissionError = (typeof SUBMISSION_ERRORS)[number];

/** What the ward picker sends when the person does not know their ward. */
export const WARD_UNKNOWN = "unknown";

/** Spaces, dashes and brackets dropped, then a leading +91 / 91 / 0. What is
 * left must be a 10-digit Indian mobile number. Blank stays blank. */
function cleanMobile(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const digits = value.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (digits === "") return undefined;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

const requiredCoordinate = (min: number, max: number) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number({ error: "location_missing" }).min(min, { error: "location_missing" }).max(max, { error: "location_missing" }),
  );

export const submissionSchema = z.object({
  // Honeypot: real visitors never fill this in (it's visually hidden).
  website: z.string().max(0, { error: "" }).optional().default(""),

  // The columns are named *_en, but residents type in either language; the
  // text is sorted into the right column when the report is accepted.
  name_en: z.string({ error: "title_short" }).trim().min(3, { error: "title_short" }).max(200, { error: "title_long" }),
  description_en: z
    .string({ error: "description_missing" })
    .trim()
    .min(1, { error: "description_missing" })
    .max(4000, { error: "description_long" }),
  latitude: requiredCoordinate(-90, 90),
  longitude: requiredCoordinate(-180, 180),
  // A ward number from the list, or WARD_UNKNOWN - which is stored as null.
  ward_no: z.preprocess(
    blankToUndefined,
    z
      .string({ error: "ward_missing" })
      .refine((value) => value === WARD_UNKNOWN || WARDS.some((w) => String(w.no) === value), { error: "ward_missing" })
      .transform((value) => (value === WARD_UNKNOWN ? null : Number(value))),
  ),
  // The only personal detail asked for, and not required.
  submitter_phone: z.preprocess(
    cleanMobile,
    z.string().regex(/^[6-9]\d{9}$/, { error: "phone_invalid" }).optional(),
  ),
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

  area: z.enum(AREA_SLUGS, { error: "Choose an area." }),
  local_body: optionalText,
  local_body_type: z.preprocess(blankToUndefined, z.enum(LOCAL_BODY_TYPES).optional()),
  latitude: optionalLatitude,
  longitude: optionalLongitude,

  cost_inr: z.preprocess(blankToUndefined, z.coerce.number().min(0).optional()),
  cost_note: z.preprocess(blankToUndefined, z.enum(COST_NOTES).optional()),
  tenure: optionalText,
  inaugurated_on: optionalDate,
  promised_completion_on: optionalDate,
  department: optionalText,
  ward_no: optionalWard,

  // As on a public-works site board. Only for works that have one (roads,
  // drains); the site does not track issue types.
  contractor_name: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  contractor_source: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),

  status: z.enum(PROJECT_STATUSES),
  reported_on: optionalDate,
  resolved_on: optionalDate,

  instagram_url: optionalUrl,
  youtube_url: optionalUrl,

  is_published: formBoolean,
}).refine(coordinatesArePaired, {
  error: "Choose both latitude and longitude, or leave the location blank.",
  path: ["latitude"],
})
  // A name on the public record must trace to a document (see CLAUDE.md).
  .refine((data) => !data.contractor_name || Boolean(data.contractor_source), {
    error: "Say where the name comes from: work order, RTI reply or a photo of the site board.",
    path: ["contractor_source"],
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
  status_after: z.preprocess(blankToUndefined, z.enum(PROJECT_STATUSES).optional()),
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
  support_enabled: formBoolean,
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
