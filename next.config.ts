// next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
});

module.exports = nextConfig;