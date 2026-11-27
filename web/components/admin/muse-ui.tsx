import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Small server-rendered building blocks for the Muse-styled admin dashboard:
 * stat tiles, section cards, a hand-rolled bar meter and line chart (no
 * charting dependency), and a status timeline. Kept generic so later admin
 * pages can reuse them rather than each page inventing its own card shell.
 */

export function StatTile({
  label,
  value,
  delta,
  deltaTone = "up",
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  delta?: string;
  deltaTone?: "up" | "down" | "warn";
  icon: LucideIcon;
  href?: string;
}) {
  const body = (
    <Card className="flex-row items-center gap-4 px-5 py-5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {delta && (
            <span
              className={cn(
                "text-sm font-bold",
                deltaTone === "down" && "text-destructive",
                deltaTone === "warn" && "text-amber-600",
                deltaTone === "up" && "text-emerald-600",
              )}
            >
              {delta}
            </span>
          )}
        </div>
      </div>
      <span className="admin-gradient grid size-11 shrink-0 place-items-center rounded-xl text-white shadow-sm" aria-hidden="true">
        <Icon className="size-5" />
      </span>
    </Card>
  );

  if (!href) return body;
  return (
    <Link
      href={href}
      className="block rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {body}
    </Link>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  tone = "light",
  className,
  contentClassName,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", tone === "dark" && "admin-gradient-deep text-white", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle && (
            <p className={cn("mt-0.5 text-sm", tone === "dark" ? "text-white/70" : "text-muted-foreground")}>{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("px-5 pb-5", contentClassName)}>{children}</div>
    </Card>
  );
}

export function MuseTableHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/70 px-1 pb-2 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
      {children}
    </div>
  );
}

export function MuseTableRow({ href, children }: { href?: string; children: ReactNode }) {
  const className =
    "flex items-center gap-3 rounded-lg px-1 py-3 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

/** Horizontal bar meter - label, proportional bar, value. Used in place of a
 * charting library for the area breakdown; `tone="dark"` renders it in
 * white-on-gradient for use inside a `SectionCard tone="dark"`. */
export function BarMeter({
  data,
  tone = "light",
  hrefFor,
}: {
  data: { key: string; label: string; value: number }[];
  tone?: "light" | "dark";
  hrefFor?: (key: string) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const row = (
          <div className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 sm:grid-cols-[9rem_1fr_auto]">
            <span className={cn("truncate text-sm font-medium", tone === "dark" ? "text-white/90" : "text-foreground")}>{d.label}</span>
            <span className={cn("h-2.5 overflow-hidden rounded-full", tone === "dark" ? "bg-white/15" : "bg-muted")} aria-hidden="true">
              <span
                className={cn("block h-full rounded-full", tone === "dark" ? "bg-white" : "bg-primary")}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </span>
            <span className={cn("w-6 text-right text-sm font-semibold tabular-nums", tone === "dark" ? "text-white" : "text-foreground")}>
              {d.value}
            </span>
          </div>
        );
        if (!hrefFor) return <div key={d.key}>{row}</div>;
        return (
          <Link
            key={d.key}
            href={hrefFor(d.key)}
            className={cn(
              "-mx-2 block rounded-lg px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2",
              tone === "dark" ? "hover:bg-white/10 focus-visible:ring-white/60" : "hover:bg-muted focus-visible:ring-ring",
            )}
          >
            {row}
          </Link>
        );
      })}
    </div>
  );
}

/** Two-series line chart as a plain inline SVG - no charting dependency. */
export function LineChart({
  points,
  series,
}: {
  points: { label: string }[];
  series: { key: string; label: string; color: string; values: number[] }[];
}) {
  const width = 600;
  const height = 200;
  const pad = 24;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = points.length;
  const stepX = n > 1 ? (width - pad * 2) / (n - 1) : 0;
  const yFor = (v: number) => height - pad - (v / max) * (height - pad * 2);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Issues added versus reported, last 12 months">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={pad}
            x2={width - pad}
            y1={height - pad - t * (height - pad * 2)}
            y2={height - pad - t * (height - pad * 2)}
            className="stroke-[var(--border)]"
            strokeWidth={1}
          />
        ))}
        {series.map((s) => (
          <polyline
            key={s.key}
            points={s.values.map((v, i) => `${pad + i * stepX},${yFor(v)}`).join(" ")}
            fill="none"
            style={{ stroke: s.color }}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {series.map((s) =>
          s.values.map((v, i) => (
            <circle key={`${s.key}-${i}`} cx={pad + i * stepX} cy={yFor(v)} r={2.5} style={{ fill: s.color }} />
          )),
        )}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-muted-foreground">
        {points.map((p, i) => (
          <span key={i} className={n > 6 && i % 2 !== 0 ? "hidden sm:inline" : undefined}>
            {p.label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Timeline({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function TimelineItem({
  icon: Icon,
  dotClassName,
  title,
  meta,
  href,
  last,
}: {
  icon: LucideIcon;
  dotClassName: string;
  title: string;
  meta?: string;
  href?: string;
  last?: boolean;
}) {
  const content = (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-white", dotClassName)} aria-hidden="true">
          <Icon className="size-3.5" />
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <p className="truncate text-sm font-medium">{title}</p>
        {meta && <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>}
      </div>
    </div>
  );
  if (!href) return content;
  return (
    <Link
      href={href}
      className="-mx-1 block rounded-lg px-1 pt-0.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}
