import type { NextConfig } from "next";

// Configuration to fix webpack hashing issues
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Remove experimental features
  experimental: {},
  // Fix webpack hashing and chunk issues
  webpack: (config, { dev, isServer }) => {
    // Fix for undefined length errors in webpack hashing
    if (!dev && !isServer) {
      // Ensure stable chunk IDs
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
    }

    // Ensure resolve fallbacks for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
  // Disable source maps to prevent hashing issues
  productionBrowserSourceMaps: false,
  // Disable static optimization for problematic components
  staticPageGenerationTimeout: 1000,
};

export default nextConfig;
