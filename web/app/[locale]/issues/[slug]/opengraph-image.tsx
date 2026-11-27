import { ImageResponse } from "next/og";
import { computeDayCounter } from "@/lib/dates";
import { formatCostINR } from "@/lib/format";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getArea } from "@/lib/areas";
import { pick } from "@/lib/pick";
import { getProjectBySlug } from "@/lib/data/projects";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * Makes a shared project link look designed instead of blank on
 * WhatsApp/Instagram - the day counter is the whole point of the site, so
 * it gets rendered large here too, not just the name.
 */
export default async function OGImage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const project = await getProjectBySlug(slug);

  if (!project) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#111", color: "#fff", fontSize: 48 }}>
          {dict.site.name}
        </div>
      ),
      size,
    );
  }

  const name = pick(project, "name", locale);
  const area = getArea(project.area);
  const areaName = area ? (locale === "ml" ? area.ml : area.en) : project.area;
  const counter = computeDayCounter(project);
  const cost = typeof project.cost_inr === "number" ? formatCostINR(project.cost_inr, dict) : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 64,
          background: "#171714",
          borderTop: "24px solid #f5c400",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          {dict.site.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, lineHeight: 1.15, maxWidth: 1000 }}>
            {name}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#f5c400" }}>{areaName}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 96, fontWeight: 900, lineHeight: 1 }}>
              {counter.days.toLocaleString("en-IN")}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#ccc" }}>
              {counter.frozen ? dict.og.days_to_resolve : dict.og.days_outstanding}
            </div>
          </div>
          {cost && (
            <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>{cost}</div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
