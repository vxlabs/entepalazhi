import {
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  Send,
  Sparkles,
  TimerReset,
  type LucideIcon,
} from "lucide-react";
import type { ProjectStatus } from "@/lib/types";

/**
 * Single source of truth for how a project status is presented across the
 * admin: icon, badge classes (used by StatusBadge), and a flat dot colour
 * for compact list rows. Previously the dashboard and StatusBadge each kept
 * their own map and disagreed on `lead` and `no_action`.
 */
export const STATUS_ORDER: ProjectStatus[] = [
  "reported",
  "acknowledged",
  "work_resumed",
  "completed",
  "lead",
  "no_action",
];

export const STATUS_META: Record<
  ProjectStatus,
  { icon: LucideIcon; badge: string; dot: string }
> = {
  lead: {
    icon: Sparkles,
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  reported: {
    icon: Send,
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  acknowledged: {
    icon: BadgeCheck,
    badge: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
    dot: "bg-blue-500",
  },
  work_resumed: {
    icon: TimerReset,
    badge: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
    dot: "bg-sky-500",
  },
  completed: {
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  no_action: {
    icon: CircleAlert,
    badge: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
    dot: "bg-red-500",
  },
};
