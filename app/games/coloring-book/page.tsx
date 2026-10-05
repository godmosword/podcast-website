import type { Metadata } from "next";
import ColoringBook from "@/components/coloring/ColoringBook";
import JsonLd from "@/components/JsonLd";
import { videoGameJsonLd } from "@/lib/json-ld";
import { gameBySlug } from "@/data/games";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "繪本著色",
  description:
    "選一臺車車或一個故事畫面來塗。先用蠟筆塗塗看，再用填滿把整塊塗上顏色。適合 3–7 歲。",
  alternates: { canonical: "/games/coloring-book" },
  openGraph: {
    title: "繪本著色 · 車車遊樂園",
    description: "把 podcast 裡的車車朋友塗上喜歡的顏色！",
    url: `${getSiteUrl()}/games/coloring-book`,
  },
};

export default function ColoringBookPage() {
  return (
    <>
      <JsonLd data={videoGameJsonLd(gameBySlug("coloring-book"))} />
      <ColoringBook />
    </>
  );
}
