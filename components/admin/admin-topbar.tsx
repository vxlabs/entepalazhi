"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Settings } from "lucide-react";
import { logoutAdmin } from "@/actions/admin/auth";
import { Button } from "@/components/ui/button";
import { activeAdminNavItem } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

const iconLinkClass =
  "relative grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AdminTopbar({ email, pendingCount }: { email: string; pendingCount: number }) {
  const pathname = usePathname();
  const section = activeAdminNavItem(pathname)?.label ?? "Admin";

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 bg-background/80 px-4 backdrop-blur md:pl-[16.5rem] md:pr-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex items-center gap-2 md:hidden">
          <span className="admin-gradient grid size-9 place-items-center rounded-xl text-lg font-black text-white shadow-sm" aria-hidden="true">
            A
          </span>
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="text-xs text-muted-foreground">
            Pages <span className="mx-1">/</span> {section}
          </p>
          <p className="truncate text-base font-semibold tracking-tight">{section}</p>
        </div>

        <form action="/admin/projects" method="get" className="relative ml-auto hidden w-full max-w-xs sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            name="q"
            placeholder="Search cases..."
            className="h-9 w-full rounded-lg bg-card pl-9 pr-3 text-sm shadow-[var(--admin-shadow-card)] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Link href="/admin/queue" className={iconLinkClass} aria-label="Reviews">
          <Bell className="size-[18px]" aria-hidden="true" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" aria-hidden="true" />
          )}
        </Link>
        <Link href="/admin/settings" className={cn(iconLinkClass, "hidden sm:grid")} aria-label="Settings">
          <Settings className="size-[18px]" aria-hidden="true" />
        </Link>

        <div className="ml-1 flex items-center gap-2 border-l border-border/70 pl-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground" aria-hidden="true">
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-40 truncate text-sm font-medium lg:inline">{email}</span>
          <form action={logoutAdmin}>
            <Button type="submit" variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-foreground">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
