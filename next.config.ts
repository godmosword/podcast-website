import type { NextConfig } from "next";
import { legacyStoryRedirects } from "./lib/story-slug-aliases";

const nextConfig: NextConfig = {
  // 全站靜態預渲染 (SSG)，零後端、零外部依賴。
  // Vercel 會自動辨識 Next.js，無需額外設定。
  reactStrictMode: true,
  images: {
    // D1：Next Image 管線補 AVIF（WebP 為預設）；故事封面 blur 見 StoryImage。
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return legacyStoryRedirects();
  },
};

export default nextConfig;
