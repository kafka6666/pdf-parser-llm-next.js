// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbo: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        'file-uri-to-path': false
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.js',
    };
    return config;
  },
};

export default nextConfig;