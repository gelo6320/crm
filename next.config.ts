/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/crm',
  output: 'standalone',
  eslint: {
    // Disabilita ESLint durante le build e i comandi dev
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;