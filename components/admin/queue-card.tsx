"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { approveSubmission, rejectSubmission, archiveProject } from "@/actions/admin/approve";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getDistrict } from "@/lib/kerala";
import type { PendingSubmission } from "@/lib/data/admin";

export function QueueCard({ submission }: { submission: PendingSubmission }) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveSubmission(submission.id);
      if (result.ok) router.push(`/admin/projects/${submission.id}`);
      else setError(result.error ?? "Could not accept this submission. Please try again.");
    });
  }

  function handleReject() {
    const formData = new FormData();
    formData.set("project_id", submission.id);
    formData.set("reason", reason);
    startTransition(async () => {
      const result = await rejectSubmission(formData);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Could not reject this submission.");
    });
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveProject(submission.id);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Could not archive this submission.");
    });
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{submission.name_en}</h3>
          <p className="text-sm text-muted-foreground">
            {getDistrict(submission.district)?.en ?? submission.district} · submitted {submission.submitted_on} ·{" "}
            {submission.photoCount} photo{submission.photoCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {submission.description_en && (
        <p className="mt-2 text-sm text-muted-foreground">{submission.description_en}</p>
      )}

      <button
        type="button"
        onClick={() => setShowContact((v) => !v)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        <ChevronDown className={`size-3.5 transition-transform ${showContact ? "rotate-180" : ""}`} />
        Submitter contact
      </button>
      {showContact && (
        <div className="mt-1 space-y-0.5 rounded-md bg-muted/50 p-2 text-sm">
          <p>{submission.submitter?.name || "(no name given)"}</p>
          {submission.submitter?.email && <p>{submission.submitter.email}</p>}
          {submission.submitter?.phone && <p>{submission.submitter.phone}</p>}
          {submission.submitter?.note && <p className="text-muted-foreground">{submission.submitter.note}</p>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={handleApprove} disabled={pending}>
          Accept & edit
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowReject((v) => !v)} disabled={pending}>
          Reject
        </Button>
        <AlertDialog><AlertDialogTrigger render={<Button size="sm" variant="ghost" disabled={pending}>Archive</Button>} /><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Archive this submission?</AlertDialogTitle><AlertDialogDescription>It will be kept internally but removed from the review list.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={handleArchive}>Archive</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>

      {showReject && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (kept internally, not shown to the submitter)"
            rows={2}
          />
          <Button size="sm" variant="destructive" onClick={handleReject} disabled={pending || !reason.trim()}>
            Confirm reject
          </Button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
