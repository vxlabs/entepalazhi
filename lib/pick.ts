import type { Locale } from "@/lib/i18n/config";

/**
 * Reads a bilingual "<field>_en" / "<field>_ml" pair off a row and falls
 * back to English when the Malayalam column is empty. This is what lets
 * Malayalam content be added gradually without ever showing a blank page -
 * see the Phase 1 plan, "Bilingual - path prefix, not cookie".
 */
export function pick<Row extends Record<string, unknown>>(
  row: Row,
  field: string,
  locale: Locale,
): string {
  const en = row[`${field}_en`];
  const ml = row[`${field}_ml`];
  if (locale === "ml" && typeof ml === "string" && ml.trim().length > 0) {
    return ml;
  }
  return typeof en === "string" ? en : "";
}
