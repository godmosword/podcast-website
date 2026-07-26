import type { Metadata } from "next";
import CandyKartGameHost from "@/app/games/candy-kart/CandyKartGameHost";
import { GamePageShell } from "@/components/games/GamePageShell";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "繽紛卡丁車",
  description:
    "馬卡龍黏土風 3D 卡丁車：6 條糖果賽道、3 圈競速、收集彩虹星星，拿下繽紛糖果盃！",
  openGraph: {
    title: "繽紛卡丁車 · 車車遊樂園",
    description: "Godot 打造的馬卡龍卡丁車：漂移過彎、收集星星、爭奪糖果盃。",
    url: `${getSiteUrl()}/games/candy-kart`,
  },
};

export default function CandyKartGamePage() {
  return (
    <GamePageShell title="繽紛卡丁車小遊戲" gameId="candy-kart" preload={false}>
      <CandyKartGameHost />
    </GamePageShell>
  );
}
