import { LayoutDashboard, Inbox, FolderKanban, Settings, type LucideIcon } from "lucide-react";

/**
 * Single source of truth for admin navigation: the sidebar, the mobile tab
 * bar, and the topbar breadcrumb all read from this so they cannot drift.
 */
export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
};

export type AdminNavSection = {
  label: string | null;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    label: null,
    items: [
      { href: "/admin", label: "Home", icon: LayoutDashboard, exact: true },
      { href: "/admin/queue", label: "Reviews", icon: Inbox, exact: false },
      { href: "/admin/projects", label: "Cases", icon: FolderKanban, exact: false },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings, exact: false }],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_SECTIONS.flatMap((section) => section.items);

export function isAdminNavActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname.startsWith(href);
}

/** The item that best matches the current path, for the topbar breadcrumb. */
export function activeAdminNavItem(pathname: string): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.find((item) => isAdminNavActive(pathname, item.href, item.exact));
}
