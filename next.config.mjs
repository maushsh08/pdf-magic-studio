/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',               // 静的サイトとして書き出す設定
  basePath: '/pdf-magic-studio',   // リポジトリ名
  images: { unoptimized: true },   // 画像最適化をオフ（Pages対応）
};

export default nextConfig;
