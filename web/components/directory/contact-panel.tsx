import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { t, type Dictionary } from "@/lib/i18n/dict";
import { telHref, tx, type ContactPanelData } from "@/lib/directory";
import { cn } from "@/lib/utils";

const LINK = "underline decoration-board-500 decoration-2 underline-offset-4 hover:decoration-foreground";

export function PhoneLink({
  number,
  dict,
  className,
}: {
  number: string;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <a
      href={telHref(number)}
      aria-label={t(dict.directory.call_aria, { number })}
      className={cn("font-bold tabular-nums whitespace-nowrap", LINK, className)}
    >
      {number}
    </a>
  );
}

export function EmailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className={cn("break-all", LINK)}>
      {email}
    </a>
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex items-center gap-1 font-bold", LINK)}
    >
      {children}
      <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 inline-block bg-board-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-board-950">
      {children}
    </p>
  );
}

/** One office or service, set out like a notice board: label, then value. */
export function ContactPanel({
  data,
  locale,
  dict,
}: {
  data: ContactPanelData;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <article className="border bg-background p-5">
      {data.chip && <Chip>{tx(data.chip, locale)}</Chip>}
      <h4 className="text-lg font-black tracking-tight">{tx(data.title, locale)}</h4>
      {data.meta && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tx(data.meta, locale)}</p>}
      <dl className="mt-4 divide-y border-y text-sm">
        {data.rows.map((row) => (
          <div key={`${row.label}-${row.value}`} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3 py-2.5">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {dict.directory.labels[row.label]}
            </dt>
            <dd className="min-w-0">
              {row.kind === "phone" && <PhoneLink number={row.value} dict={dict} />}
              {row.kind === "email" && <EmailLink email={row.value} />}
              {row.kind === "text" && <span className="font-bold">{row.value}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {data.note && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{tx(data.note, locale)}</p>}
      {data.link && (
        <p className="mt-3 text-sm">
          <ExternalLink href={data.link.url}>{tx(data.link.label, locale)}</ExternalLink>
        </p>
      )}
    </article>
  );
}
