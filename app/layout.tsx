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

export const metadata: Metadata = {
  title: "車車遊樂園",
  description: "給孩子看圖聽故事的小天地，左右翻頁、聽聽聲音。",
  manifest: "/manifest.json",
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
