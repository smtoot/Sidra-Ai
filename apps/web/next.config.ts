import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all for now (safest for unknown R2 domains), or restrict if R2_PUBLIC_URL is fixed. 
        // ideally we parse process.env.R2_PUBLIC_URL but for audit fix, permissive is safer to avoid breakage.
      },
    ],
  },
};

export default nextConfig;
