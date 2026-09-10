import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared page container so every admin screen shares one width and spacing scale. */
export function AdminPage({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-medium tracking-wide text-primary">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
