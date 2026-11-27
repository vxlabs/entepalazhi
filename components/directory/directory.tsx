import type { Locale } from "@/lib/i18n/config";
import { t, type Dictionary } from "@/lib/i18n/dict";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WardFinder } from "@/components/directory/ward-finder";
import {
  Chip,
  ContactPanel,
  EmailLink,
  ExternalLink,
  PhoneLink,
} from "@/components/directory/contact-panel";
import {
  CAVEATS,
  COMMITTEES,
  DEPARTMENTS,
  DIRECTORY_AS_OF,
  EMERGENCY,
  HELPLINES,
  KSEB_SECTIONS,
  KSEB_WHATSAPP,
  LEADERS,
  OVERVIEW_STATS,
  PANCHAYAT_OFFICE,
  POLICE,
  PORTALS,
  PROBLEM_GUIDE,
  SOURCES,
  VILLAGE_OFFICES,
  WARDS,
  WARDS_SOURCE_URL,
  WARD_CHANGE_NOTE,
  WATER_HEALTH,
  tx,
} from "@/lib/directory";
import { cn } from "@/lib/utils";

const TAB_LIST =
  "flex w-full flex-wrap justify-start gap-2 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto";
const TAB_TRIGGER =
  "h-auto flex-none rounded-none border border-foreground/20 px-3 py-2 text-sm font-bold text-foreground/70 data-active:border-foreground data-active:bg-foreground data-active:text-background";

const TH = "px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground";
const TD = "px-3 py-3 align-top";

function formatAsOf(locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ml" ? "ml-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${DIRECTORY_AS_OF}T00:00:00Z`));
}

function SubHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h3>
      {body && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  );
}

function Note({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "warning" }) {
  return (
    <p
      className={cn(
        "border-l-4 px-4 py-3 text-sm leading-relaxed",
        tone === "warning" ? "border-board-500 bg-board-50 text-board-950" : "border-foreground/30 bg-muted/60",
      )}
    >
      {children}
    </p>
  );
}

function DataTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border bg-background">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/60">
            {head.map((label) => (
              <th key={label} scope="col" className={TH}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr]:border-b [&_tr:last-child]:border-b-0">{children}</tbody>
      </table>
    </div>
  );
}

export function Directory({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const d = dict.directory;

  return (
    <section id="directory" className="scroll-mt-24">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-board-600">{d.kicker}</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">{d.title}</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{d.intro}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(d.as_of, { date: formatAsOf(locale) })} {d.independent}
        </p>
      </div>

      <div className="flex flex-col gap-14">
        {/* Emergency numbers: always visible, largest tap targets on the page. */}
        <div>
          <SubHeading title={d.emergency_title} body={d.emergency_body} />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {EMERGENCY.map((item, i) => (
              <li key={item.number}>
                <a
                  href={`tel:${item.number}`}
                  aria-label={`${tx(item.label, locale)}: ${t(d.call_aria, { number: item.number })}`}
                  className={cn(
                    "flex h-full flex-col border p-4 transition-colors hover:border-foreground",
                    i === 0 ? "border-board-500 bg-board-500 text-black" : "bg-background",
                  )}
                >
                  <span className={cn("text-[11px] font-bold uppercase tracking-wider", i === 0 ? "text-black/70" : "text-muted-foreground")}>
                    {tx(item.label, locale)}
                  </span>
                  <span className="mt-2 text-4xl font-black leading-none tracking-tight tabular-nums">{item.number}</span>
                  <span className={cn("mt-3 text-xs leading-snug", i === 0 ? "text-black/70" : "text-muted-foreground")}>
                    {tx(item.note, locale)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{d.helplines_label}</span>
            {HELPLINES.map((h) => (
              <span key={h.number}>
                {tx(h.label, locale)} <PhoneLink number={h.number} dict={dict} />
              </span>
            ))}
          </p>
        </div>

        {/* Ward members */}
        <div>
          <SubHeading title={d.wards_title} body={d.wards_body} />
          <WardFinder
            wards={WARDS}
            labels={{
              search_label: d.search_label,
              search_placeholder: d.search_placeholder,
              result_count: d.result_count,
              show_all: d.show_all,
              show_fewer: d.show_fewer,
              no_match: d.no_match,
              col_ward: d.col_ward,
              col_ward_name: d.col_ward_name,
              col_member: d.col_member,
              col_phone: d.col_phone,
              copy: d.copy,
              copied: d.copied,
              copy_aria: d.copy_aria,
              call_aria: d.call_aria,
            }}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            <ExternalLink href={WARDS_SOURCE_URL}>{d.wards_source}</ExternalLink>
          </p>
        </div>

        {/* Everything else, one group at a time */}
        <div>
          <SubHeading title={d.more_title} />
          <Tabs defaultValue="leadership" className="gap-6">
            <TabsList className={TAB_LIST}>
              <TabsTrigger value="leadership" className={TAB_TRIGGER}>{d.tab_leadership}</TabsTrigger>
              <TabsTrigger value="police" className={TAB_TRIGGER}>{d.tab_police}</TabsTrigger>
              <TabsTrigger value="electricity" className={TAB_TRIGGER}>{d.tab_electricity}</TabsTrigger>
              <TabsTrigger value="panchayat" className={TAB_TRIGGER}>{d.tab_panchayat}</TabsTrigger>
              <TabsTrigger value="water-health" className={TAB_TRIGGER}>{d.tab_water_health}</TabsTrigger>
              <TabsTrigger value="village" className={TAB_TRIGGER}>{d.tab_village}</TabsTrigger>
              <TabsTrigger value="online" className={TAB_TRIGGER}>{d.tab_online}</TabsTrigger>
              <TabsTrigger value="guide" className={TAB_TRIGGER}>{d.tab_guide}</TabsTrigger>
            </TabsList>

            <TabsContent value="leadership" className="flex flex-col gap-5">
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{d.leadership_body}</p>
              <div className="grid gap-4 md:grid-cols-3">
                {LEADERS.map((leader) => (
                  <article key={leader.name} className="border bg-background p-5">
                    <Chip>{tx(leader.role, locale)}</Chip>
                    <h4 className="text-lg font-black tracking-tight">{leader.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{tx(leader.meta, locale)}</p>
                    {leader.phone && (
                      <p className="mt-4 text-2xl font-black tracking-tight">
                        <PhoneLink number={leader.phone} dict={dict} />
                      </p>
                    )}
                    {leader.email && (
                      <p className="mt-2 text-sm">
                        <EmailLink email={leader.email} />
                      </p>
                    )}
                  </article>
                ))}
              </div>
              <h4 className="mt-2 text-base font-black">{d.committees_title}</h4>
              <DataTable head={[d.col_committee, d.col_chair, d.col_contact]}>
                {COMMITTEES.map((c) => (
                  <tr key={c.chair}>
                    <td className={TD}>{tx(c.committee, locale)}</td>
                    <td className={cn(TD, "font-bold")}>{c.chair}</td>
                    <td className={TD}>
                      <PhoneLink number={c.phone} dict={dict} />
                    </td>
                  </tr>
                ))}
              </DataTable>
            </TabsContent>

            <TabsContent value="police" className="flex flex-col gap-5">
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{d.police_body}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {POLICE.map((p) => (
                  <ContactPanel key={tx(p.title, "en")} data={p} locale={locale} dict={dict} />
                ))}
              </div>
              <Note tone="warning">{d.police_warning}</Note>
            </TabsContent>

            <TabsContent value="electricity" className="flex flex-col gap-5">
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{d.electricity_body}</p>
              <DataTable head={[d.col_section, d.col_landline, d.col_section_mobile]}>
                {KSEB_SECTIONS.map((s) => (
                  <tr key={s.section}>
                    <td className={cn(TD, "font-bold")}>{s.section}</td>
                    <td className={TD}>
                      {s.landline ? (
                        <PhoneLink number={s.landline} dict={dict} />
                      ) : (
                        <span className="text-muted-foreground">{d.not_known}</span>
                      )}
                    </td>
                    <td className={TD}>
                      {s.mobile ? (
                        <PhoneLink number={s.mobile} dict={dict} />
                      ) : (
                        <span className="text-muted-foreground">{d.not_known}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </DataTable>
              <Note>{t(d.electricity_note, { number: KSEB_WHATSAPP })}</Note>
            </TabsContent>

            <TabsContent value="panchayat" className="grid gap-4 md:grid-cols-2">
              <ContactPanel data={PANCHAYAT_OFFICE} locale={locale} dict={dict} />
              <article className="border bg-background p-5">
                <Chip>{d.departments_chip}</Chip>
                <h4 className="text-lg font-black tracking-tight">{d.departments_title}</h4>
                <dl className="mt-4 divide-y border-y text-sm">
                  {DEPARTMENTS.map((dept) => (
                    <div key={dept.email} className="py-2.5">
                      <dt className="font-bold">{dept.name}</dt>
                      <dd className="mt-0.5">
                        <EmailLink email={dept.email} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            </TabsContent>

            <TabsContent value="water-health" className="grid gap-4 md:grid-cols-2">
              {WATER_HEALTH.map((p) => (
                <ContactPanel key={tx(p.title, "en")} data={p} locale={locale} dict={dict} />
              ))}
            </TabsContent>

            <TabsContent value="village" className="flex flex-col gap-5">
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{d.village_body}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {VILLAGE_OFFICES.map((p) => (
                  <ContactPanel key={tx(p.title, "en")} data={p} locale={locale} dict={dict} />
                ))}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{d.village_note}</p>
            </TabsContent>

            <TabsContent value="online" className="flex flex-col gap-5">
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{d.online_body}</p>
              <DataTable head={[d.col_need, d.col_portal]}>
                {PORTALS.map((p) => (
                  <tr key={p.url}>
                    <td className={TD}>{tx(p.need, locale)}</td>
                    <td className={TD}>
                      <ExternalLink href={p.url}>{p.name}</ExternalLink>
                    </td>
                  </tr>
                ))}
              </DataTable>
            </TabsContent>

            <TabsContent value="guide" className="flex flex-col gap-5">
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{d.guide_body}</p>
              <DataTable head={[d.col_issue, d.col_first_contact]}>
                {PROBLEM_GUIDE.map((row) => (
                  <tr key={row.issue.en}>
                    <td className={TD}>{tx(row.issue, locale)}</td>
                    <td className={cn(TD, "font-bold")}>{tx(row.contact, locale)}</td>
                  </tr>
                ))}
              </DataTable>
              <Note>{d.guide_tip}</Note>
            </TabsContent>
          </Tabs>
        </div>

        {/* About the panchayat, and how far to trust this list */}
        <div className="flex flex-col gap-5">
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{d.overview}</p>
          <dl className="grid grid-cols-2 border-t border-l bg-background lg:grid-cols-4">
            {OVERVIEW_STATS.map((stat) => (
              <div key={stat.label.en} className="border-r border-b p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tx(stat.label, locale)}</dt>
                <dd className="mt-2 text-2xl font-black tracking-tight tabular-nums">{tx(stat.value, locale)}</dd>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground">{tx(stat.sub, locale)}</dd>
              </div>
            ))}
          </dl>
          <Note>{tx(WARD_CHANGE_NOTE, locale)}</Note>

          <details className="border bg-background">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold">{d.caveats_title}</summary>
            <div className="border-t px-4 py-4 text-sm">
              <p className="leading-relaxed text-muted-foreground">{d.caveats_body}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {CAVEATS.map((c) => (
                  <li key={c.title.en} className="leading-relaxed">
                    <span className="font-bold">{tx(c.title, locale)}:</span> {tx(c.body, locale)}
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <details className="border bg-background">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold">{d.sources_title}</summary>
            <div className="border-t px-4 py-4 text-sm">
              <p className="leading-relaxed text-muted-foreground">{d.sources_body}</p>
              <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
                {SOURCES.map((s) => (
                  <li key={s.url}>
                    <ExternalLink href={s.url}>{tx(s.label, locale)}</ExternalLink>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
