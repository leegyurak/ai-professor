import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
  },
};

export default nextConfig;
