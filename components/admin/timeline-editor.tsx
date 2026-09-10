"use client";

import { useActionState, useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { addTimelineEntry, deleteTimelineEntry, type TimelineFormState } from "@/actions/admin/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminDateField } from "@/components/admin/admin-date-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDictionary } from "@/lib/i18n/dict";
import { PROJECT_STATUSES } from "@/lib/schemas";
import type { ProjectUpdate } from "@/lib/types";

const dict = getDictionary("en");
const initialState: TimelineFormState = { status: "idle" };

export function TimelineEditor({
  projectId,
  slug,
  updates,
}: {
  projectId: string;
  slug: string;
  updates: ProjectUpdate[];
}) {
  const action = addTimelineEntry.bind(null, projectId, slug);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const formId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleDelete(entryId: string) {
    startTransition(async () => {
      await deleteTimelineEntry(entryId, projectId, slug);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {updates.length === 0 && <p className="text-sm text-muted-foreground">No timeline entries yet.</p>}
        {updates.map((u) => (
          <div key={u.id} className="flex items-start justify-between gap-2 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">
                {u.happened_on} — {u.title_en}
              </p>
              {u.body_en && <p className="mt-1 text-sm text-muted-foreground">{u.body_en}</p>}
              {u.status_after && <p className="mt-1 text-xs text-muted-foreground">status → {u.status_after}</p>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>

      {/* A nested <form> is invalid HTML — ProjectForm already wraps this in one.
          This form's fields live here but submit via the `form` attribute to a
          sibling <form> portaled onto document.body instead of being its DOM descendant. */}
      {mounted && createPortal(<form id={formId} action={formAction} />, document.body)}
      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-semibold">Add an update</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AdminDateField id="happened_on" name="happened_on" label="Date" required error={state.fieldErrors?.happened_on} form={formId} />
          <div className="space-y-1">
            <Label htmlFor="status_after">New status (optional)</Label>
            <Select name="status_after" form={formId}>
              <SelectTrigger id="status_after">
                <SelectValue placeholder="No change" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {dict.status[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="title_en">Title</Label>
          <Input id="title_en" name="title_en" required form={formId} />
          {state.fieldErrors?.title_en && <p className="text-sm text-destructive">{state.fieldErrors.title_en}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="body_en">Body (optional)</Label>
          <Textarea id="body_en" name="body_en" rows={3} form={formId} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="source_url">Source URL (optional)</Label>
          <Input id="source_url" name="source_url" type="url" form={formId} />
        </div>
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
        <Button type="submit" form={formId} disabled={pending} size="sm">
          {pending ? "Saving..." : "Add update"}
        </Button>
      </div>
    </div>
  );
}
