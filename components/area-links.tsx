import Link from "next/link";
import { KERALA_DISTRICTS } from "@/lib/kerala";
import type { Locale } from "@/lib/i18n/config";

export function DistrictLinks({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-wrap gap-2">
      {KERALA_DISTRICTS.map((d) => (
        <Link
          key={d.slug}
          href={`/${locale}/projects/district/${d.slug}`}
          className="rounded-full border px-3 py-1.5 text-sm hover:bg-accent"
        >
          {locale === "ml" ? d.ml : d.en}
        </Link>
      ))}
    </div>
  );
}
