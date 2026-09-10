import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getSiteSettings } from "@/lib/data/settings";
import { pick } from "@/lib/pick";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const settings = await getSiteSettings();
  // A disabled /support has no metadata worth serving - notFound() below
  // handles the actual 404, this just keeps a crawler from indexing a title.
  if (!settings.support_enabled) return {};
  return { title: pick(settings as unknown as Record<string, unknown>, "support_title", locale) || undefined };
}

/**
 * 404s while support_enabled is false - not merely hidden with CSS - and
 * absent from nav/footer/sitemap (see components/site-header.tsx,
 * site-footer.tsx, app/sitemap.ts). Body is stored as plain text and
 * rendered as paragraphs here, never as HTML, so the field can't become
 * an injection vector.
 */
export default async function SupportPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();

  if (!settings.support_enabled) notFound();

  const title = pick(settings as unknown as Record<string, unknown>, "support_title", locale);
  const body = pick(settings as unknown as Record<string, unknown>, "support_body", locale);
  const linkLabel = pick(settings as unknown as Record<string, unknown>, "support_link_label", locale);
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const upiQr = settings.support_upi_id
    ? await QRCode.toDataURL(`upi://pay?pa=${settings.support_upi_id}`, { margin: 1, width: 220 })
    : null;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{title || dict.support.contact_title}</h1>

      {paragraphs.length > 0 && (
        <div className="space-y-3 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
        {dict.support.not_deductible}
      </p>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <h2 className="font-semibold">{dict.support.contact_title}</h2>
        {settings.support_email && (
          <p className="text-sm">
            {dict.support.email_label}:{" "}
            <a href={`mailto:${settings.support_email}`} className="underline underline-offset-4">
              {settings.support_email}
            </a>
          </p>
        )}
        {settings.support_phone && (
          <p className="text-sm">
            {dict.support.phone_label}:{" "}
            <a href={`tel:${settings.support_phone}`} className="underline underline-offset-4">
              {settings.support_phone}
            </a>
          </p>
        )}
        {settings.support_link_url && (
          <p className="text-sm">
            <a href={settings.support_link_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              {linkLabel || dict.support.link_label}
            </a>
          </p>
        )}
        {upiQr && settings.support_upi_id && (
          <div className="flex flex-col items-start gap-2 border-t pt-3">
            <p className="text-sm">
              {dict.support.upi_label}: <span className="font-mono">{settings.support_upi_id}</span>
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- locally generated data: URI, not an optimizable remote asset */}
            <img src={upiQr} alt={`UPI QR for ${settings.support_upi_id}`} width={160} height={160} />
          </div>
        )}
      </div>
    </div>
  );
}
