import type { Dictionary } from "@/lib/i18n/dict";

const CRORE = 1_00_00_000;
const LAKH = 1_00_000;

/** Renders a rupee amount as crore/lakh, matching how Kerala news coverage quotes project costs. */
export function formatCostINR(amountInr: number, d: Dictionary): string {
  if (amountInr >= CRORE) {
    return `\u20b9${trimZeros(amountInr / CRORE)} ${d.common.crore}`;
  }
  if (amountInr >= LAKH) {
    return `\u20b9${trimZeros(amountInr / LAKH)} ${d.common.lakh}`;
  }
  return `\u20b9${amountInr.toLocaleString("en-IN")}`;
}

function trimZeros(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function formatDays(days: number, d: Dictionary): string {
  return `${days.toLocaleString("en-IN")} ${days === 1 ? d.common.day : d.common.days}`;
}
