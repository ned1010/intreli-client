import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Show ESLint errors during development
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Show TypeScript errors during development
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
