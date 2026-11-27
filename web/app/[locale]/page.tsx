import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project-card";
import { StatsBanner } from "@/components/stats-banner";
import { AreaLinks } from "@/components/area-links";
import { Directory } from "@/components/directory/directory";
import { alternateLanguages, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getRecentProjects, getStatsSummary } from "@/lib/data/projects";
import { ArrowDown, ArrowRight, MapPin, Megaphone } from "lucide-react";


type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const pathname = `/${locale}`;
  return {
    title: dict.home.meta_title,
    description: dict.site.tagline,
    alternates: {
      canonical: pathname,
      languages: alternateLanguages(pathname),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  const [recent, stats] = await Promise.all([getRecentProjects(6), getStatsSummary()]);

  return (
    <div className="flex flex-col">
      <section className="accountability-hero overflow-hidden bg-[#171714] text-white">
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.35fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-board-400">
              <span className="h-px w-8 bg-board-500" aria-hidden="true" />
              {dict.home.eyebrow}
            </p>
            {/* Malayalam glyphs are wider and taller than Latin ones: the
                tight leading and negative tracking that suit the English
                headline clip its vowel signs and overflow the column. */}
            <h1
              className={
                locale === "ml"
                  ? "max-w-3xl text-3xl font-black leading-[1.3] sm:text-5xl lg:text-6xl"
                  : "max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl"
              }
            >
              {dict.home.hero_title}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70 sm:text-xl">
              {dict.home.hero_body}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-board-500 px-5 text-base font-bold text-black hover:bg-board-400"
                nativeButton={false}
                render={<Link href={`/${locale}/report`} />}
              >
                <Megaphone />
                {dict.home.cta_report}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/25 bg-transparent px-5 text-base text-white hover:bg-white hover:text-black"
                nativeButton={false}
                render={<Link href={`/${locale}/issues`} />}
              >
                {dict.home.cta_browse}
                <ArrowRight />
              </Button>
            </div>
            <a
              href="#directory"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/80 underline decoration-board-500 decoration-2 underline-offset-4 hover:text-white"
            >
              {dict.home.directory_link}
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </div>
          <StatsBanner stats={stats} dict={dict} />
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-16 sm:px-6 sm:py-20">
        {recent.length > 0 && (
          <section>
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-board-600">{dict.home.recent_kicker}</p>
                <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">{dict.home.recent_title}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{dict.home.recent_body}</p>
              </div>
              <Link href={`/${locale}/issues`} className="group flex shrink-0 items-center gap-2 text-sm font-bold underline decoration-board-500 decoration-2 underline-offset-4">
                {dict.home.browse_all}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((project) => (
                <ProjectCard key={project.id} project={project} locale={locale} dict={dict} />
              ))}
            </div>
          </section>
        )}

        <Directory locale={locale} dict={dict} />

        <section className="grid gap-8 border-y py-10 md:grid-cols-[0.7fr_1.3fr] md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-board-600" />
              <h2 className="text-xl font-black">{dict.home.areas_title}</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{dict.home.areas_meta}</p>
          </div>
          <AreaLinks locale={locale} />
        </section>

        <section className="relative overflow-hidden bg-board-500 px-6 py-10 text-black sm:px-10 sm:py-12">
          <div className="relative z-10 flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div>
              <h2 className="max-w-2xl text-2xl font-black tracking-tight sm:text-3xl">{dict.home.action_title}</h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-black/70">{dict.home.action_body}</p>
            </div>
            <Button size="lg" className="h-12 shrink-0 bg-black px-5 text-base text-white hover:bg-black/80" nativeButton={false} render={<Link href={`/${locale}/report`} />}>
              {dict.home.cta_report}<ArrowRight />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
