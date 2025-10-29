import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Cast to `any` so TypeScript won't complain about `turbo`
  experimental: {
    turbo: true,
  } as any,
};

export default nextConfig;
