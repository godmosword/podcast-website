import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "海盜卡丁車大賽",
  description:
    "復古像素風 top-down 海盜賽車：張帆加速、大砲射擊，和 AI 海盜搶寶藏、跑三圈！適合親子同樂。",
  openGraph: {
    title: "海盜卡丁車大賽 · 車車遊樂園",
    description: "16-bit 熱帶海盜卡丁車競速，方向鍵駕駛、Shift 張帆、空白鍵開砲。",
    url: `${getSiteUrl()}/games/pirate-kart`,
  },
};

export default function PirateKartLayout({ children }: { children: ReactNode }) {
  return children;
}
