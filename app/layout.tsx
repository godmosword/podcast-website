import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

// 童趣圓潤字型，避免使用 Inter/Arial 等通用字型。
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-baloo",
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
    // iPhone「加入主畫面」會用這張（180x180，滿版、iOS 自動套圓角）
    apple: "/apple-touch-icon.png",
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
  maximumScale: 1,
  // 鎖住縮放，避免孩子誤觸放大。
  userScalable: false,
  // 處理瀏海 / 圓角螢幕，搭配 globals.css 的 env(safe-area-inset-*)。
  viewportFit: "cover",
  themeColor: "#fff7ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={baloo.variable}>
      <body>{children}</body>
    </html>
  );
}
