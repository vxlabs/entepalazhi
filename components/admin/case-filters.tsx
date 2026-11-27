"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PALAZHI_AREAS } from "@/lib/areas";
import { PROJECT_STATUSES } from "@/lib/schemas";
import { getDictionary } from "@/lib/i18n/dict";

type Props = { query?: string; status?: string; area?: string; published?: string; reported?: string };

export function CaseFilters({ query = "", status = "", area = "", published = "", reported = "" }: Props) {
  const router = useRouter();
  const dict = getDictionary("en");
  const [q, setQ] = useState(query);
  const [nextStatus, setNextStatus] = useState(status);
  const [nextArea, setNextArea] = useState(area);
  const [nextPublished, setNextPublished] = useState(published);
  const [nextReported, setNextReported] = useState(reported);

  function apply(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (nextArea) params.set("area", nextArea);
    if (nextPublished) params.set("published", nextPublished);
    if (nextReported) params.set("reported", nextReported);
    router.push(`/admin/projects${params.size ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={apply} className="grid grid-cols-1 gap-2 rounded-xl border bg-card p-3 lg:grid-cols-6">
      <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search issues..." className="h-9 lg:col-span-2" />
      <Select value={nextStatus || "all"} onValueChange={(value) => setNextStatus(value === "all" ? "" : value ?? "")}>
        <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All statuses</SelectItem>{PROJECT_STATUSES.map((item) => <SelectItem key={item} value={item}>{dict.status[item]}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={nextArea || "all"} onValueChange={(value) => setNextArea(value === "all" ? "" : value ?? "")}>
        <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All areas</SelectItem>{PALAZHI_AREAS.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.en}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={nextPublished || "all"} onValueChange={(value) => setNextPublished(value === "all" ? "" : value ?? "")}>
        <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Any visibility</SelectItem><SelectItem value="true">Published</SelectItem><SelectItem value="false">Draft</SelectItem></SelectContent>
      </Select>
      <Select value={nextReported || "all"} onValueChange={(value) => setNextReported(value === "all" ? "" : value ?? "")}>
        <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Any reporting state</SelectItem><SelectItem value="true">Ever reported</SelectItem><SelectItem value="false">Not reported yet</SelectItem></SelectContent>
      </Select>
      <div className="flex gap-2 lg:col-span-5"><Button type="submit">Apply filters</Button><Button type="button" variant="ghost" onClick={() => { setQ(""); setNextStatus(""); setNextArea(""); setNextPublished(""); setNextReported(""); router.push("/admin/projects"); }}>Clear</Button></div>
    </form>
  );
}
