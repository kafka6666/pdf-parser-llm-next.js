import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbo: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.js',
    };
    return config;
  },
};

export default nextConfig;
