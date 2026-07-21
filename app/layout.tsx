import type { Metadata, Viewport } from "next";
import { Baloo_2, Gochi_Hand } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import JsonLd from "@/components/JsonLd";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ReturnVisitPing from "@/components/ReturnVisitPing";
import SiteNavBar from "@/components/landing/SiteNavBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import SvgDefs from "@/components/decor/SvgDefs";
import { siteIdentityJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// 童趣圓潤字型，避免使用 Inter/Arial 等通用字型。
const baloo = Baloo_2({
  subsets: ["latin"],
  // 補 800：標題／標籤大量用 font-weight:800，拉丁/數字需真字重，
  // 否則搭配全域 font-synthesis-weight:none 會落回 700（見 globals.css）。
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-baloo",
});

// 手繪麥克筆風字型（僅含拉丁/數字）。中文字會回退到 huninn。
// 用於標題的拉丁字符與英文標誌，營造參考圖的手寫塗鴉感。
const gochi = Gochi_Hand({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-marker",
});

// jf-open 粉圓（huninn）— 已子集化成站內用到的中文字（~100KB）。
// 拉丁/數字交給 Baloo（字型堆疊在前），中文字由此提供。
// 新增文案後重跑：npm run font:subset
const huninn = localFont({
  src: "./fonts/huninn-subset.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-huninn",
});

export const metadata: Metadata = {
  // 單一來源：production 永不用臨時 deployment 網域（見 lib/site-url.ts）。
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "車車遊樂園",
    template: "%s · 車車遊樂園",
  },
  description: "給孩子看圖聽故事的小天地，左右翻頁、聽聽聲音。",
  manifest: "/manifest.json",
  openGraph: {
    title: "車車遊樂園",
    description: "每天一個車車故事，陪孩子長大。Bonbon & 馬米親子 Podcast。",
    locale: "zh_TW",
    type: "website",
    siteName: "車車遊樂園",
    images: [{ url: "/mascot.png", alt: "車車遊樂園吉祥物" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "車車遊樂園",
    description: "每天一個車車故事，陪孩子長大。",
    images: ["/mascot.png"],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/apple-touch-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "車車遊樂園",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 開放縮放：家長共讀可放大文字／插圖，符合 WCAG 1.4.4（不鎖 maximumScale／userScalable）。
  // 處理瀏海 / 圓角螢幕，搭配 globals.css 的 env(safe-area-inset-*)。
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      suppressHydrationWarning
      className={`${baloo.variable} ${huninn.variable} ${gochi.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <JsonLd data={siteIdentityJsonLd()} />
      </head>
      <body>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            跳到主內容
          </a>
          <div className="site-backdrop" aria-hidden />
          <SvgDefs />
          <SiteNavBar />
          <div id="main-content" tabIndex={-1} className="site-root">
            {children}
          </div>
          <ServiceWorkerRegister />
          <ReturnVisitPing />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
