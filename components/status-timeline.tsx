import { StatusBadge } from "@/components/status-badge";
import { formatDateIST } from "@/lib/dates";
import { pick } from "@/lib/pick";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";
import type { ProjectUpdate } from "@/lib/types";

export function StatusTimeline({
  updates,
  locale,
  dict,
}: {
  updates: ProjectUpdate[];
  locale: Locale;
  dict: Dictionary;
}) {
  if (updates.length === 0) {
    return <p className="text-sm text-muted-foreground">{dict.detail.timeline_empty}</p>;
  }

  return (
    <ol className="relative ml-3 border-l pl-6">
      {updates.map((update) => {
        const title = pick(update, "title", locale);
        const body = pick(update, "body", locale);
        return (
          <li key={update.id} className="mb-8 last:mb-0">
            <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-foreground" />
            <div className="flex flex-wrap items-center gap-2">
              <time className="text-sm font-medium text-muted-foreground">
                {formatDateIST(update.happened_on, locale)}
              </time>
              {update.status_after && <StatusBadge status={update.status_after} dict={dict} />}
            </div>
            <h4 className="mt-1 font-semibold">{title}</h4>
            {body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
            {update.source_url && (
              <a
                href={update.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm underline-offset-4 hover:underline"
              >
                {dict.detail.source}
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}
