import type { Metadata } from "next";
import BlockDropGameHost from "@/app/games/block-drop/BlockDropGameHost";
import { GamePageShell } from "@/components/games/GamePageShell";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "繽紛樂園",
  description: "黏土風落下方塊小遊戲，排滿整行就有糖果般的消除回饋。",
  openGraph: {
    title: "繽紛樂園 · 車車遊樂園",
    description: "黏土風落下方塊小遊戲，排滿整行就有糖果般的消除回饋。",
    url: `${getSiteUrl()}/games/block-drop`,
  },
};

export default function BlockDropPage() {
  return (
    <GamePageShell title="繽紛樂園" gameId="block-drop">
      <BlockDropGameHost />
    </GamePageShell>
  );
}
