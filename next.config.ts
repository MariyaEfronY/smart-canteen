import type { NextConfig } from "next";

const nextConfig: NextConfig = {
eslint: {
  ignoreDuringBuilds: true
},
  typescript: {
    // ✅ Ignore TypeScript type errors during builds
    ignoreBuildErrors: true,
  },
  experimental: {
    // ✅ Keep Turbopack stable for production
    turbo: {
      rules: {
        "*.ts": { loaders: ["ts-loader"] },
        "*.tsx": { loaders: ["ts-loader"] }
      }
    }
  }
};

export default nextConfig;
