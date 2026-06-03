import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import localFont from "next/font/local";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

// 童趣圓潤字型，避免使用 Inter/Arial 等通用字型。
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-baloo",
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "車車遊樂園",
    template: "%s · 車車遊樂園",
  },
  description: "給孩子看圖聽故事的小天地，左右翻頁、聽聽聲音。",
  manifest: "/manifest.json",
  openGraph: {
    title: "車車遊樂園",
    description: "每天一個車車故事，陪孩子長大。Bonbon & 馬米親子 podcast。",
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
  // 不鎖縮放，方便家長放大閱讀與系統輔助功能。
  viewportFit: "cover",
  themeColor: "#fff7ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${baloo.variable} ${huninn.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
