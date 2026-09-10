"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KERALA_DISTRICTS } from "@/lib/kerala";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";
import type { ProjectStatus } from "@/lib/types";

const STATUSES: ProjectStatus[] = [
  "lead",
  "reported",
  "acknowledged",
  "work_resumed",
  "completed",
  "no_action",
];

const ALL = "__all__";

/**
 * Writes every choice into the URL's search params rather than component
 * state, so the resulting view is a real, shareable, server-rendered URL -
 * see the Phase 1 plan's routes table. Selects navigate immediately; the
 * text search waits for form submit so every keystroke doesn't push a URL.
 */
export function FilterBar({
  locale,
  dict,
  departments,
}: {
  locale: Locale;
  dict: Dictionary;
  departments: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/${locale}/projects${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", query);
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.projects.filter_search_placeholder}
          aria-label={dict.projects.filter_search}
        />
        <Button type="submit" variant="secondary">
          {dict.projects.filter_search}
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          value={searchParams.get("district") ?? ALL}
          onValueChange={(v) => updateParam("district", v ?? ALL)}
        >
          <SelectTrigger aria-label={dict.projects.filter_district}>
            <SelectValue placeholder={dict.projects.filter_district} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.projects.filter_all_districts}</SelectItem>
            {KERALA_DISTRICTS.map((d) => (
              <SelectItem key={d.slug} value={d.slug}>
                {locale === "ml" ? d.ml : d.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("status") ?? ALL}
          onValueChange={(v) => updateParam("status", v ?? ALL)}
        >
          <SelectTrigger aria-label={dict.projects.filter_status}>
            <SelectValue placeholder={dict.projects.filter_status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.projects.filter_all_statuses}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {dict.status[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("department") ?? ALL}
          onValueChange={(v) => updateParam("department", v ?? ALL)}
        >
          <SelectTrigger aria-label={dict.projects.filter_department}>
            <SelectValue placeholder={dict.projects.filter_department} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.projects.filter_all_departments}</SelectItem>
            {departments.map((dep) => (
              <SelectItem key={dep} value={dep}>
                {dep}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("sort") ?? "newest"}
          onValueChange={(v) => updateParam("sort", v ?? "newest")}
        >
          <SelectTrigger aria-label={dict.projects.filter_sort}>
            <SelectValue placeholder={dict.projects.filter_sort} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{dict.projects.sort_newest}</SelectItem>
            <SelectItem value="days_desc">{dict.projects.sort_days_desc}</SelectItem>
            <SelectItem value="cost_desc">{dict.projects.sort_cost_desc}</SelectItem>
            <SelectItem value="seen_desc">{dict.projects.sort_seen_desc}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/projects`)}
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {dict.projects.filter_clear}
        </button>
      )}
    </div>
  );
}
