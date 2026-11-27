"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { togglePublish } from "@/actions/admin/update-project";

export function PublishToggle({ projectId, isPublished }: { projectId: string; isPublished: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Switch
      checked={isPublished}
      disabled={pending}
      onCheckedChange={(checked) =>
        startTransition(async () => {
          await togglePublish(projectId, checked);
          router.refresh();
        })
      }
      aria-label="Published"
    />
  );
}
