import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Folder links preload their contents; keep that copy for 30s so teammates'
    // changes show up quickly. Our own changes call router.refresh(), which clears it.
    staleTimes: { dynamic: 30, static: 30 },
  },
};

export default nextConfig;
