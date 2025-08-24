import type { NextConfig } from "next";

// Minimal configuration to avoid Webpack hashing issues
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Remove any experimental features that might cause issues
  experimental: {},
  // Ensure clean webpack setup
  webpack: (config) => {
    // Don't modify webpack config to avoid hashing issues
    return config;
  },
};

export default nextConfig;
