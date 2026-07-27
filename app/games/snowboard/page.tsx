import type { Metadata } from "next";
import SnowboardGameHost from "./SnowboardGameHost";
import { GamePageShell } from "@/components/games/GamePageShell";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "阿蹦雪山衝刺",
  description:
    "跟著阿蹦滑下糖霜雪峰：左右 carving、跳過障礙、收齊 12 枚彩虹雪花，挑戰三星完賽。",
  openGraph: {
    title: "阿蹦雪山衝刺 · 車車遊樂園",
    description: "親子 3D 滑雪板遊戲：滑下糖霜雪峰，收集彩虹雪花。",
    url: `${getSiteUrl()}/games/snowboard`,
    images: ["/games/v2/snowboard/cover.webp"],
  },
};

export default function SnowboardGamePage() {
  return (
    <GamePageShell title="阿蹦雪山衝刺小遊戲" gameId="snowboard" preload={false}>
      <SnowboardGameHost />
    </GamePageShell>
  );
}
