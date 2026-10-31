import type { NextConfig } from "next";

/**
 * Uploaded images are served from the bucket's public URL (S3_PUBLIC_URL).
 * next/image needs that host at build time, so set S3_PUBLIC_URL as a build
 * variable in Coolify (it isn't secret).
 */
function bucketImagePattern(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const raw = process.env.S3_PUBLIC_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: `${url.pathname.replace(/\/+$/, "")}/**`,
      },
    ];
  } catch {
    console.warn(`Ignoring invalid S3_PUBLIC_URL: ${raw}`);
    return [];
  }
}

const nextConfig: NextConfig = {
  // Self-contained server bundle in .next/standalone for the Docker image (Coolify).
  output: "standalone",
  poweredByHeader: false,
  // No floating Next.js "N" button while developing.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: bucketImagePattern(),
  },
  // Fixed security headers. The Content-Security-Policy is set per request in
  // src/proxy.ts, because it depends on runtime settings.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // HTTPS for two years, on every subdomain (ignored over plain HTTP).
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Legacy clickjacking protection; CSP frame-ancestors does the same.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
