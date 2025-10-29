import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Ignore TypeScript type errors during builds
    ignoreBuildErrors: true,
  },
  turbopack: {
    // ✅ You can configure options here later if needed
  },
  reactStrictMode: true,
};

export default nextConfig;
