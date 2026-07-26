import type { Metadata } from "next";
import CandyMatchGameHost from "@/app/games/candy-match/CandyMatchGameHost";
import { GamePageShell } from "@/components/games/GamePageShell";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "繽紛消消樂",
  description:
    "小朋友的第一款消除遊戲：沒有時間壓力、沒有輸贏挫折，找一找、排一排、消一消，完成可愛的繽紛任務。適合 3–7 歲。",
  openGraph: {
    title: "繽紛消消樂 · 車車遊樂園",
    description:
      "車車角色三連線消除：10 個遊樂園關卡、收集／打掃／送禮物任務，溫柔鼓勵不挫折。",
    url: `${getSiteUrl()}/games/candy-match`,
  },
};

export default function CandyMatchPage() {
  return (
    <GamePageShell title="繽紛消消樂小遊戲" gameId="candy-match">
      <CandyMatchGameHost />
    </GamePageShell>
  );
}
