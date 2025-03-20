import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Add Turbopack configuration
  experimental: {
    turbo: {
      rules: {
        // Add any specific Turbopack rules here if needed
      }
    }
  },
  // Configure static export for Netlify
  output: 'export'
};

export default nextConfig;
