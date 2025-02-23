// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbo: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.js',
    };
    return config;
  },
};

module.exports = nextConfig;