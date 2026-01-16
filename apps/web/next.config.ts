import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_JITSI_ENABLED: process.env.NEXT_PUBLIC_JITSI_ENABLED,
    NEXT_PUBLIC_JITSI_DOMAIN: process.env.NEXT_PUBLIC_JITSI_DOMAIN,
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 public buckets (*.r2.dev)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      // Custom domain if configured via R2_PUBLIC_URL
      ...(process.env.R2_PUBLIC_URL ? [{
        protocol: 'https' as const,
        hostname: new URL(process.env.R2_PUBLIC_URL).hostname,
      }] : []),
    ],
  },
};

export default nextConfig;
