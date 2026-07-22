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
  outputFileTracingIncludes: {
    "/story/[slug]/opengraph-image": ["./public/stories/*/01.jpg"],
  },
  // 紅線保險：即便 route 誤引動態 public 路徑，feed.xml 也不該帶走大資產目錄。
  // 正解仍是 verify:no-public-fs + generate:audio-lengths（勿依賴此排除當唯一閘門）。
  outputFileTracingExcludes: {
    "/feed.xml": [
      "./public/stories/**",
      "./public/candy-kart/**",
      "./public/games/**",
      "./public/adventures/**",
      "./public/characters/**",
      "./public/landing/**",
    ],
  },
  async redirects() {
    return legacyStoryRedirects();
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // 避免瀏覽器把非預期格式的回應當成可執行內容。
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 僅在跨站請求送出 origin，降低網址與 query 意外外洩。
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 本站不需要相機、麥克風、定位或付款 API。
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // 允許本站的遊戲 iframe，但禁止第三方網站嵌入整個網站。
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          ...(process.env.VERCEL_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
