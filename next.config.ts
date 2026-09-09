import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Gzip all responses
  compress: true,

  // ── Strip the X-Powered-By header (saves bytes + hides stack)
  poweredByHeader: false,

  typescript: {
    ignoreBuildErrors: true,
  },

  // ── Ultra-fast Client Router Cache & Bundle Optimization
  experimental: {
    staleTimes: {
      dynamic: 30, // Keep dynamic pages in client router cache for 30 seconds
      static: 300, // Keep prefetched / static pages for 5 minutes
    },
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "emoji-picker-react",
      "sonner",
    ],
  },

  // ── Image optimisation: auto WebP/AVIF, long CDN cache
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2_592_000, // 30 days
    deviceSizes: [360, 480, 640, 750, 828, 1080],
    imageSizes: [32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async headers() {
    return [
      // Global security headers
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // Service worker — never cache so updates roll out immediately
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // PWA icons / static assets — immutable long-lived cache
      {
        source: "/icon-(.*).png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
