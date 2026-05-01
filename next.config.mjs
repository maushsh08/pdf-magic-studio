/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out', // これを追加：出力フォルダ名を明示的に指定
  images: {
    unoptimized: true,
  },
  basePath: '/pdf-magic-studio',
  typescript: { 
    ignoreBuildErrors: true 
  },
  trailingSlash: true,
};

export default nextConfig;
