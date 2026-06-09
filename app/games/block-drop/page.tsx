import type { Metadata } from "next";
import BlockDropGame from "@/components/games/BlockDropGame";
import { GamePageShell } from "@/components/games/GamePageShell";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "繽紛方塊",
  description: "原創落下方塊益智小遊戲，排滿整行就消除，挑戰最高分。",
  openGraph: {
    title: "繽紛方塊 · 車車遊樂園",
    description: "原創落下方塊益智小遊戲，排滿整行就消除，挑戰最高分。",
    url: `${getSiteUrl()}/games/block-drop`,
  },
};

export default function BlockDropPage() {
  return (
    <GamePageShell title="繽紛方塊小遊戲">
      <BlockDropGame />
    </GamePageShell>
  );
}
