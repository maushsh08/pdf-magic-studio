/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // これが最重要！HTMLとして書き出す設定です
  images: {
    unoptimized: true, // GitHub Pagesでは画像の最適化が使えないため必須
  },
  // もしURLが https://ユーザー名.github.io/crowd/ のようになるなら、以下も追加
  basePath: '/pdf-magic-studio', 
};

module.exports = nextConfig;
