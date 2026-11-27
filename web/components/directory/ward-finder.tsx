"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/directory/copy-button";
import type { Ward } from "@/lib/directory";

export type WardFinderLabels = {
  search_label: string;
  search_placeholder: string;
  result_count: string;
  show_all: string;
  show_fewer: string;
  no_match: string;
  col_ward: string;
  col_ward_name: string;
  col_member: string;
  col_phone: string;
  copy: string;
  copied: string;
  copy_aria: string;
  call_aria: string;
};

/** Rows shown before the reader searches or asks for the full list. */
const COLLAPSED_COUNT = 8;

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export function WardFinder({ wards, labels }: { wards: Ward[]; labels: WardFinderLabels }) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const index = useMemo(
    () =>
      wards.map((w) => ({
        ward: w,
        haystack: `${w.no} ${String(w.no).padStart(2, "0")} ${w.name} ${w.member} ${w.phone}`.toLowerCase(),
      })),
    [wards],
  );

  const q = query.toLowerCase().trim().replace(/\s+/g, " ");
  const matches = q ? index.filter((entry) => entry.haystack.includes(q)).map((entry) => entry.ward) : wards;
  const collapsed = !q && !expanded;
  const visible = collapsed ? matches.slice(0, COLLAPSED_COUNT) : matches;

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <label htmlFor={inputId} className="sr-only">
            {labels.search_label}
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.search_placeholder}
            autoComplete="off"
            className="h-11 rounded-none pl-9"
          />
        </div>
        <p className="text-xs font-bold text-muted-foreground" aria-live="polite">
          {fill(labels.result_count, { shown: matches.length, total: wards.length })}
        </p>
      </div>

      <div className="border bg-background">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="w-12 px-3 py-2.5 sm:w-16">
                {labels.col_ward}
              </th>
              <th scope="col" className="px-2 py-2.5">
                {labels.col_ward_name}
              </th>
              <th scope="col" className="hidden px-2 py-2.5 sm:table-cell">
                {labels.col_member}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right sm:text-left">
                {labels.col_phone}
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((w) => (
              <tr key={w.no} className="border-b last:border-b-0">
                <td className="px-3 py-3 align-top font-mono text-sm font-bold tabular-nums text-muted-foreground">
                  {String(w.no).padStart(2, "0")}
                </td>
                <td className="px-2 py-3 align-top">
                  <span className="font-bold">{w.name}</span>
                  <span className="block text-muted-foreground sm:hidden">{w.member}</span>
                </td>
                <td className="hidden px-2 py-3 align-top sm:table-cell">{w.member}</td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center justify-end gap-2 sm:justify-start sm:gap-3">
                    <a
                      href={`tel:${w.phone}`}
                      aria-label={fill(labels.call_aria, { number: w.phone })}
                      className="font-bold tabular-nums whitespace-nowrap underline decoration-board-500 decoration-2 underline-offset-4 hover:decoration-foreground"
                    >
                      {w.phone}
                    </a>
                    <CopyButton
                      value={w.phone}
                      label={labels.copy}
                      copiedLabel={labels.copied}
                      ariaLabel={fill(labels.copy_aria, { number: w.phone })}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {matches.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{labels.no_match}</p>
        )}
      </div>

      {!q && wards.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 w-full border border-foreground/25 px-4 py-3 text-sm font-bold transition-colors hover:border-foreground hover:bg-foreground hover:text-background sm:w-auto"
        >
          {expanded ? labels.show_fewer : fill(labels.show_all, { total: wards.length })}
        </button>
      )}
    </div>
  );
}
