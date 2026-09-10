import { differenceInCalendarDays, parseISO } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

export const IST = "Asia/Kolkata";

/** "Today" as a calendar date in IST, independent of the server's own timezone. */
export function todayInIST(): Date {
  return toZonedTime(new Date(), IST);
}

/** Today's calendar date in India, safe to submit to Postgres `date` columns. */
export function todayIsoInIST(): string {
  return formatInTimeZone(new Date(), IST, "yyyy-MM-dd");
}

export function parseDateOnly(value: string): Date {
  // Project date columns are Postgres `date` (no time component); parse as
  // a plain calendar date rather than letting the platform's local
  // midnight interpretation shift the day.
  return parseISO(value);
}

export type DayCounter = {
  /** Number of whole days between the anchor date and "now" (or resolution). */
  days: number;
  /** Whether the count is frozen because the project was marked resolved. */
  frozen: boolean;
  /** Which anchor the count is measured from. */
  basis: "reported" | "flagged";
};

/**
 * The big counter's arithmetic, per the plan:
 *   from = reported_on ?? submitted_on
 *   end  = resolved_on ?? today (IST)
 *   days = end - from
 */
export function computeDayCounter(project: {
  reported_on: string | null;
  submitted_on: string;
  resolved_on: string | null;
}): DayCounter {
  const from = project.reported_on
    ? parseDateOnly(project.reported_on)
    : parseDateOnly(project.submitted_on);
  const end = project.resolved_on ? parseDateOnly(project.resolved_on) : todayInIST();
  const days = Math.max(0, differenceInCalendarDays(end, from));
  return {
    days,
    frozen: Boolean(project.resolved_on),
    basis: project.reported_on ? "reported" : "flagged",
  };
}

export function daysOverdue(promisedOn: string): number {
  return Math.max(0, differenceInCalendarDays(todayInIST(), parseDateOnly(promisedOn)));
}

export function formatDateIST(value: string, locale: "en" | "ml"): string {
  // date-fns-tz's formatInTimeZone doesn't localize month names for ml, so
  // dates are rendered numerically (DD MMM YYYY) which reads fine in both
  // languages rather than mixing an English month name into Malayalam text.
  void locale;
  return formatInTimeZone(parseDateOnly(value), IST, "d MMM yyyy");
}
