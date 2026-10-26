import type { Metadata } from "next";
import OrangeExpressGameHost from "@/app/games/orange-express/OrangeExpressGameHost";
import { GamePageShell } from "@/components/games/GamePageShell";
import JsonLd from "@/components/JsonLd";
import { videoGameJsonLd } from "@/lib/json-ld";
import { gameBySlug } from "@/data/games";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "小橘特快車",
  description:
    "坐上小橘的駕駛台，推左邊讓車走、拉右邊讓車停，到站開門接朋友。適合 3–7 歲。",
  alternates: { canonical: "/games/orange-express" },
  openGraph: {
    title: "小橘特快車 · 車車遊樂園",
    description: "橘色小線的駕駛台：自己決定走多快，到站停好再開門。",
    url: `${getSiteUrl()}/games/orange-express`,
  },
};

export default function OrangeExpressPage() {
  return (
    <GamePageShell title="小橘特快車小遊戲" gameId="orange-express">
      <JsonLd data={videoGameJsonLd(gameBySlug("orange-express"))} />
      <OrangeExpressGameHost />
    </GamePageShell>
  );
}
