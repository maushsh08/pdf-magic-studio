/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // リポジトリ名と完全に一致させてください
  basePath: '/pdf-magic-studio', 
};

module.exports = nextConfig;
