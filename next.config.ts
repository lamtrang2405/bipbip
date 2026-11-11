import type { NextConfig } from "next";

function supabaseImageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw?.trim()) return [];
  try {
    const hostname = new URL(raw).hostname;
    return [
      {
        protocol: "https" as const,
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // CMS form can include long chapter content + image/excel upload.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: supabaseImageRemotePatterns(),
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
