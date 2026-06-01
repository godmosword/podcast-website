import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 全站靜態預渲染 (SSG)，零後端、零外部依賴。
  // Vercel 會自動辨識 Next.js，無需額外設定。
  reactStrictMode: true,
};

export default nextConfig;
