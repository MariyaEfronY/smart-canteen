import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Completely ignore ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Completely ignore TypeScript errors during builds
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  turbopack: {}, // ✅ For Next.js 15+
};

export default nextConfig;
