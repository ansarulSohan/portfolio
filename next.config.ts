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
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: bucketImagePattern(),
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
