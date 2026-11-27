import Link from "next/link";
import { PALAZHI_AREAS } from "@/lib/areas";
import type { Locale } from "@/lib/i18n/config";

export function AreaLinks({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALAZHI_AREAS.map((d) => (
        <Link
          key={d.slug}
          href={`/${locale}/issues/area/${d.slug}`}
          className="rounded-full border px-3 py-1.5 text-sm hover:bg-accent"
        >
          {locale === "ml" ? d.ml : d.en}
        </Link>
      ))}
    </div>
  );
}
