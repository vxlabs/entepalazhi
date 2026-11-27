import Link from "next/link";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";

/**
 * Renders inside the [locale] layout (header/footer intact) whenever a page
 * in this tree calls notFound() - an unknown project slug, an unknown
 * area, or a /support page visited while disabled. This is
 * distinct from app/global-not-found.tsx, which only fires for URLs that
 * match no route at all.
 */
export default function LocaleNotFound() {
  const dict = getDictionary(DEFAULT_LOCALE);
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold">{dict.not_found.title}</h1>
      <p className="mt-3 text-muted-foreground">{dict.not_found.body}</p>
      <p className="mt-6">
        <Link href={`/${DEFAULT_LOCALE}/issues`} className="underline underline-offset-4">
          {dict.detail.back_to_projects}
        </Link>
      </p>
    </div>
  );
}
