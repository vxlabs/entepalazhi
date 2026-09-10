import { formatCostINR, formatDays } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dict";
import type { StatsSummary } from "@/lib/data/projects";

export function StatsBanner({ stats, dict }: { stats: StatsSummary; dict: Dictionary }) {
  const items = [
    { label: dict.home.stats_tracked, value: stats.projects_tracked.toLocaleString("en-IN") },
    { label: dict.home.stats_cost, value: formatCostINR(stats.total_cost_inr, dict) },
    { label: dict.home.stats_days, value: formatDays(stats.combined_days_pending, dict) },
    { label: dict.home.stats_resolved, value: stats.resolved_count.toLocaleString("en-IN") },
  ];

  return (
    <section className="border-y border-white/15 py-6 text-white lg:border-y-0 lg:border-l lg:py-2 lg:pl-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
          {dict.home.stats_title}
        </h2>
        <span className="size-2 animate-pulse rounded-full bg-orange-500" aria-hidden="true" />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-7">
        {items.map((item) => (
          <div key={item.label} className="border-t border-white/15 pt-3">
            <dd className="text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{item.value}</dd>
            <dt className="mt-1 text-xs leading-snug text-white/60">{item.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-6 max-w-sm text-xs leading-relaxed text-white/45">{dict.home.stats_context}</p>
    </section>
  );
}
