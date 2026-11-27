import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n/dict";
import { STATUS_META } from "@/lib/status-meta";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, dict }: { status: ProjectStatus; dict: Dictionary }) {
  return (
    <Badge className={cn("border-transparent font-medium", STATUS_META[status].badge)}>
      {dict.status[status]}
    </Badge>
  );
}
