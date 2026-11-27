import type { NextConfig } from "next";

// Extra hostnames allowed to load dev assets, e.g. this machine's LAN
// address when testing from a phone: DEV_ORIGINS=192.168.1.20
const devOrigins = (process.env.DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",

  // `next dev` 403s /_next/* for any origin but the one it booted with.
  // See node_modules/next/dist/docs/.../allowedDevOrigins.md - hostnames only.
  allowedDevOrigins: ["127.0.0.1", ...devOrigins],

  // The SQLite driver is a native module, loaded from node_modules at runtime rather
  // than bundled.
  serverExternalPackages: ["better-sqlite3"],

  images: {
    // Resized copies of photos are kept on the "image-cache" volume (see
    // docker-compose.yml) so they survive a redeploy. Past this size the
    // least recently used ones are deleted, so the volume cannot fill up.
    maximumDiskCacheSize: 500_000_000,
  },

  experimental: {
    // Needed because the app has multiple root layouts (app/[locale] and
    // app/admin) and a root layout under a dynamic segment - see
    // node_modules/next/dist/docs/.../not-found.md.
    globalNotFound: true,
  },
};

export default nextConfig;
