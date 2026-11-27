"use client";

import { useEffect, useState } from "react";
import { computeDayCounter } from "@/lib/dates";
import type { Dictionary } from "@/lib/i18n/dict";
import { CheckCircle2 } from "lucide-react";

type Props = {
  reportedOn: string | null;
  submittedOn: string;
  resolvedOn: string | null;
  dict: Dictionary;
};

/**
 * Renders the initial count synchronously (no loading flash - the server
 * already computed the same value in the same IST calendar system), then,
 * for a tab left open across IST midnight, reschedules itself once to
 * recompute. This is a real gap for a long-lived tab, not a hydration
 * trick - the server and first client render always agree.
 */
export function DayCounter({ reportedOn, submittedOn, resolvedOn, dict }: Props) {
  const [counter, setCounter] = useState(() =>
    computeDayCounter({ reported_on: reportedOn, submitted_on: submittedOn, resolved_on: resolvedOn }),
  );

  useEffect(() => {
    if (counter.frozen) return; // resolved projects don't need a live tick
    const msUntilNextISTMidnight = getMsUntilNextISTMidnight();
    const timer = setTimeout(() => {
      setCounter(
        computeDayCounter({
          reported_on: reportedOn,
          submitted_on: submittedOn,
          resolved_on: resolvedOn,
        }),
      );
    }, msUntilNextISTMidnight);
    return () => clearTimeout(timer);
  }, [counter.frozen, reportedOn, submittedOn, resolvedOn]);

  const label = counter.frozen
    ? null
    : counter.basis === "reported"
      ? dict.detail.days_since_reported
      : dict.detail.days_since_flagged;

  return (
    <div
      className={
        counter.frozen
          ? "relative overflow-hidden border-l-8 border-emerald-500 bg-emerald-950 p-6 text-white sm:p-8"
          : "counter-grid relative overflow-hidden border-l-8 border-board-500 bg-[#171714] p-6 text-white shadow-2xl shadow-black/10 sm:p-8"
      }
    >
      {counter.frozen ? (
        <div className="relative z-10">
          <CheckCircle2 className="mb-8 size-8 text-emerald-400" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">{dict.detail.counter_resolved}</p>
          <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t(dict.detail.resolved_after, counter.days)}</p>
        </div>
      ) : (
        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-board-400">
            <span className="size-2 animate-pulse rounded-full bg-board-500" aria-hidden="true" />
            {dict.detail.counter_live}
          </div>
          <p className="text-7xl font-black leading-none tabular-nums tracking-[-0.07em] text-board-500 sm:text-8xl">
            {counter.days.toLocaleString("en-IN")}
          </p>
          <p className="mt-3 max-w-52 text-sm font-bold uppercase leading-snug tracking-wide text-white/65">{label}</p>
        </div>
      )}
    </div>
  );
}

function t(template: string, days: number): string {
  return template.replace("{days}", days.toLocaleString("en-IN"));
}

function getMsUntilNextISTMidnight(): number {
  // IST has no DST and is a fixed UTC+5:30 offset, so this arithmetic is
  // safe without a timezone library on the client.
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const istMidnight = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0),
  );
  const nextMidnightUtcMs = istMidnight.getTime() - IST_OFFSET_MS;
  return Math.max(1000, nextMidnightUtcMs - now.getTime());
}
