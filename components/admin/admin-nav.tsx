"use client";

import { BrandMark } from "@/components/brand-mark";
import { SITE_CONFIG } from "@/lib/site-config";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ADMIN_NAV_ITEMS, ADMIN_NAV_SECTIONS, isAdminNavActive } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * Mobile-first: a thumb-reachable bottom tab bar on phones,
 * widening to a left sidebar on desktop rather than a hamburger menu that
 * costs an extra tap on the device this is actually used on.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="Admin navigation"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl bg-card p-1.5 shadow-[var(--admin-shadow-raised)] md:hidden"
      >
        {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isAdminNavActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-lg transition-colors",
                  active ? "admin-gradient text-white shadow-sm" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <nav
        aria-label="Admin navigation"
        className="fixed inset-y-3 left-3 z-40 hidden w-60 flex-col rounded-2xl bg-card p-3 shadow-[var(--admin-shadow-card)] md:flex"
      >
        <Link
          href="/admin"
          className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark className="text-sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">{SITE_CONFIG.adminName}</span>
            <span className="block truncate text-xs text-muted-foreground">Admin</span>
          </span>
        </Link>

        <div className="border-t border-border/70 pt-1">
          {ADMIN_NAV_SECTIONS.map((section, index) => (
            <div key={section.label ?? index} className={index > 0 ? "mt-2" : undefined}>
              {section.label && (
                <p className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{section.label}</p>
              )}
              <div className="flex flex-col gap-1">
                {section.items.map(({ href, label, icon: Icon, exact }) => {
                  const active = isAdminNavActive(pathname, href, exact);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-card font-semibold text-foreground shadow-[var(--admin-shadow-raised)]"
                          : "font-medium text-muted-foreground hover:bg-secondary/70",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg",
                          active ? "admin-gradient text-white shadow-sm" : "bg-secondary text-muted-foreground",
                        )}
                      >
                        <Icon className="size-[18px]" strokeWidth={active ? 2.5 : 2} />
                      </span>
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/"
          target="_blank"
          className="admin-gradient-deep mt-auto flex flex-col gap-3 rounded-2xl p-4 text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-white/15">
            <ExternalLink className="size-[18px]" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold">View live site</span>
            <span className="mt-0.5 block text-xs text-white/75">See what visitors see</span>
          </span>
          <span className="flex min-h-9 items-center justify-center rounded-lg bg-white text-xs font-semibold text-foreground">
            Open site
          </span>
        </Link>
      </nav>
    </>
  );
}
