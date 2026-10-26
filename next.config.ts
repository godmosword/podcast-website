import type { NextConfig } from "next";
import { adventuresZoneQueryRedirects } from "./lib/adventures-redirects";
import { retiredGameRedirects } from "./lib/retired-game-redirects";
import { retiredPageRedirects } from "./lib/retired-page-redirects";
import { legacyStoryRedirects } from "./lib/story-slug-aliases";

/**
 * 視覺回歸用的凍結資料（見 lib/visual-fixture.ts）。這份產物只給本機截圖用：
 * 放 .next-visual，`next start` 與 Vercel 用的 .next 永遠是全集；CI 與 Vercel 上開了直接拒絕。
 */
const visualFixture = process.env.VISUAL_FIXTURE === "1";
if (visualFixture && (process.env.CI || process.env.VERCEL)) {
  throw new Error("VISUAL_FIXTURE=1 只能在本機跑視覺回歸，CI／Vercel 的 build 不得開啟。");
}
// VISUAL_FIXTURE_BUILD 只由下面的 env 寫進 bundle；環境裡先有它，代表有人繞過 VISUAL_FIXTURE 直接設，
// prebuild 腳本會讀到它產出 6 集版，正式 bundle 卻寫成 0，兩邊對不上。
if (process.env.VISUAL_FIXTURE_BUILD !== undefined) {
  throw new Error("不要直接設 VISUAL_FIXTURE_BUILD；視覺回歸請用 VISUAL_FIXTURE=1（npm run test:visual:trusted）。");
}

const nextConfig: NextConfig = {
  // 全站靜態預渲染 (SSG)，零後端、零外部依賴。
  // Vercel 會自動辨識 Next.js，無需額外設定。
  reactStrictMode: true,
  ...(visualFixture ? { distDir: ".next-visual" } : {}),
  // build 時寫死進 server 與 client 兩邊；用另一個名字，prebuild 的 tsx 腳本讀不到，照樣產全集。
  env: { VISUAL_FIXTURE_BUILD: visualFixture ? "1" : "0" },
  turbopack: {
    resolveAlias: {
      // 官方套件含動態 worker URL，Turbopack 無法打包。執行期改載 public/vendor。
      "maplibre-gl": "./lib/maplibre-gl-shim.ts",
    },
  },
  poweredByHeader: false,
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
      "./public/games/**",
      "./public/adventures/**",
      "./public/characters/**",
      "./public/landing/**",
    ],
  },
  async redirects() {
    return [
      ...legacyStoryRedirects(),
      ...adventuresZoneQueryRedirects(),
      ...retiredGameRedirects(),
      ...retiredPageRedirects(),
    ];
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
          // play-map 需要同源定位；本站不需要相機、麥克風或付款 API。
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
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
