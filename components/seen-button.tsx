"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/dict";
import type { Dictionary } from "@/lib/i18n/dict";

function storageKey(projectId: string) {
  return `seen:${projectId}`;
}

/**
 * One click, no login, no PII (see /api/seen and
 * supabase/migrations/0002_admin.sql's record_seen_confirmation()).
 * localStorage only remembers *this browser already clicked* so a revisit
 * shows the settled state instead of inviting a second click - it isn't
 * what dedupes the count, the server's fingerprint + unique constraint is.
 */
export function SeenButton({
  projectId,
  initialCount,
  dict,
}: {
  projectId: string;
  initialCount: number;
  dict: Dictionary;
}) {
  const [count, setCount] = useState(initialCount);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Reads a browser-only API unavailable during SSR - initial state must
    // stay false on both server and the client's first render to avoid a
    // hydration mismatch, then sync from localStorage after mount.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(localStorage.getItem(storageKey(projectId)) === "1");
    } catch {
      // Private browsing / storage blocked - fall back to always-clickable.
    }
  }, [projectId]);

  async function handleClick() {
    if (done || pending) return;
    setPending(true);
    // Optimistic: show the increment immediately, settle from the response.
    setCount((c) => c + 1);
    setDone(true);
    try {
      localStorage.setItem(storageKey(projectId), "1");
    } catch {
      // Ignore - see the effect above.
    }

    try {
      const res = await fetch("/api/seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { seenCount: number };
        setCount(data.seenCount);
      }
    } finally {
      setPending(false);
    }
  }

  const countLabel = t(count === 1 ? dict.seen.count_one : dict.seen.count_other, { count });

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant={done ? "secondary" : "outline"} onClick={handleClick} disabled={done || pending}>
        <CheckCircle2 className="mr-1.5 size-4" />
        {done ? dict.seen.button_done : dict.seen.button}
      </Button>
      <span className="text-sm text-muted-foreground">{countLabel}</span>
    </div>
  );
}
