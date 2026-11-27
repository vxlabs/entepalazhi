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
import { PALAZHI_AREAS } from "@/lib/areas";
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
 * state, so the resulting view is a real, shareable, server-rendered URL. Selects navigate immediately; the
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
    router.push(`/${locale}/issues${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", query);
  }

  const hasFilters = searchParams.toString().length > 0;

  // Base UI's <SelectValue> renders the raw value unless the root is given
  // `items`, so every select gets its value→label list here.
  const filters: {
    key: string;
    label: string;
    fallback: string;
    items: { value: string; label: string }[];
  }[] = [
    {
      key: "area",
      label: dict.projects.filter_area,
      fallback: ALL,
      items: [
        { value: ALL, label: dict.projects.filter_all_areas },
        ...PALAZHI_AREAS.map((d) => ({
          value: d.slug,
          label: locale === "ml" ? d.ml : d.en,
        })),
      ],
    },
    {
      key: "status",
      label: dict.projects.filter_status,
      fallback: ALL,
      items: [
        { value: ALL, label: dict.projects.filter_all_statuses },
        ...STATUSES.map((s) => ({ value: s, label: dict.status[s] })),
      ],
    },
    {
      key: "department",
      label: dict.projects.filter_department,
      fallback: ALL,
      items: [
        { value: ALL, label: dict.projects.filter_all_departments },
        ...departments.map((dep) => ({ value: dep, label: dep })),
      ],
    },
    {
      key: "sort",
      label: dict.projects.filter_sort,
      fallback: "newest",
      items: [
        { value: "newest", label: dict.projects.sort_newest },
        { value: "days_desc", label: dict.projects.sort_days_desc },
        { value: "cost_desc", label: dict.projects.sort_cost_desc },
      ],
    },
  ];

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
        {filters.map((f) => (
          <Select
            key={f.key}
            items={f.items}
            value={searchParams.get(f.key) ?? f.fallback}
            onValueChange={(v) => updateParam(f.key, v ?? f.fallback)}
          >
            <SelectTrigger aria-label={f.label} className="w-full">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              {f.items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/issues`)}
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {dict.projects.filter_clear}
        </button>
      )}
    </div>
  );
}
