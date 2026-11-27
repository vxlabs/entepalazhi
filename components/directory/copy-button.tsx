"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies a phone number; shows a tick for two seconds once it has. */
export function CopyButton({
  value,
  label,
  copiedLabel,
  ariaLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  ariaLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard is unavailable (insecure origin or permission denied):
      // leave the button unchanged rather than claim a copy that did not happen.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 border px-2 text-xs font-bold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      <span className="hidden sm:inline" aria-live="polite">
        {copied ? copiedLabel : label}
      </span>
    </button>
  );
}
