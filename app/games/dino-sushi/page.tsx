import type { Metadata } from "next";
import DinoSushiGameHost from "@/app/games/dino-sushi/DinoSushiGameHost";
import { GamePageShell } from "@/components/games/GamePageShell";
import JsonLd from "@/components/JsonLd";
import { videoGameJsonLd } from "@/lib/json-ld";
import { gameBySlug } from "@/data/games";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "多多壽司屋",
  description:
    "幫恐龍車多多做壽司：選飯、放料、送上迴轉帶，看多多吃得好開心！沒有倒數、沒有失敗，做錯了也能補。適合 3–7 歲。",
  alternates: { canonical: "/games/dino-sushi" },
  openGraph: {
    title: "多多壽司屋 · 車車遊樂園",
    description: "照多多的點餐做壽司，或自由做想放什麼都可以；一步一動作，溫柔不挫折。",
    url: `${getSiteUrl()}/games/dino-sushi`,
  },
};

export default function DinoSushiPage() {
  return (
    <GamePageShell title="多多壽司屋小遊戲" gameId="dino-sushi">
      <JsonLd data={videoGameJsonLd(gameBySlug("dino-sushi"))} />
      <DinoSushiGameHost />
    </GamePageShell>
  );
}
