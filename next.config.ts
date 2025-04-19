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
  env: {
    NEXT_PUBLIC_API_URL: 'https://api.costruzionedigitale.com'
  }
});

module.exports = nextConfig;