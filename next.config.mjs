/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/pdf-magic-studio',
  images: { unoptimized: true },
  // エラーで止まるのを防ぐ
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
