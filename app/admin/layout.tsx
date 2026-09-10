import type { Metadata } from "next";
import { Open_Sans, Noto_Sans_Malayalam } from "next/font/google";
import "../globals.css";
import { getAdminActor } from "@/lib/auth";
import { getPendingCount } from "@/lib/data/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";

// Matches the Muse Vue Ant Design Dashboard reference (Open Sans,
// weights 400/600/700/800 - see its public/index.html Google Fonts link).
const adminSans = Open_Sans({ variable: "--font-admin-sans", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
// Project names and editor fields can contain Malayalam even though the admin
// interface itself is English-first.
const notoMalayalam = Noto_Sans_Malayalam({
  variable: "--font-noto-malayalam",
  subsets: ["malayalam"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Admin | Aarekettikkan", template: "%s | Aarekettikkan admin" },
  robots: { index: false, follow: false },
};

/**
 * A separate root layout from app/[locale] (English-only, no dictionary) -
 * see next.config.ts's globalNotFound comment for why this split needs
 * that flag. Not gated here: layouts don't re-render on navigation, so an
 * auth check that only lives here wouldn't re-run on every route change
 * (see the Next.js auth guide, "Layouts and auth checks"). Every admin
 * page calls requireAdminPage() itself; this layout only decides whether
 * to render the nav chrome, using the non-redirecting getAdminActor().
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await getAdminActor();
  const pendingCount = actor ? await getPendingCount() : 0;

  return (
    <html lang="en" className={`${adminSans.variable} ${notoMalayalam.variable} h-full antialiased`}>
      <body className="admin-shell min-h-full bg-background text-foreground">
        {actor ? (
          <>
            <AdminTopbar email={actor.email} pendingCount={pendingCount} />
            <AdminNav />
            <main className="pb-24 md:ml-[16.5rem] md:pb-8">{children}</main>
          </>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
