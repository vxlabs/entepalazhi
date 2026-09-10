import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : undefined;

const nextConfig: NextConfig = {
  // `next dev` 403s /_next/* for any origin but the one it booted with
  // (localhost), which renders the app as unstyled HTML. This admin is
  // mobile-first and gets tested from a phone on the LAN, so allow the
  // loopback IP and this machine's LAN address as well.
  // See node_modules/next/dist/docs/.../allowedDevOrigins.md - hostnames only.
  allowedDevOrigins: ["127.0.0.1", "192.168.29.165"],

  experimental: {
    // Needed because the app has multiple root layouts (app/[locale] and
    // app/admin) and a root layout under a dynamic segment — see
    // node_modules/next/dist/docs/.../not-found.md.
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      // Approved project photos served from Supabase Storage.
      ...(supabaseUrl
        ? [
            {
              protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseUrl.hostname,
              port: supabaseUrl.port,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
