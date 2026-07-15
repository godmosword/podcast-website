import type { Metadata } from "next";
import ColoringBook from "@/components/coloring/ColoringBook";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "繪本著色",
  description:
    "選故事裡的定裝人物或場景線稿，用蠟筆與油漆桶輕鬆著色。適合 3–7 歲親子一起玩。",
  openGraph: {
    title: "繪本著色 · 車車遊樂園",
    description: "把 podcast 裡的車車朋友塗上喜歡的顏色！",
    url: `${getSiteUrl()}/games/coloring-book`,
  },
};

export default function ColoringBookPage() {
  return <ColoringBook />;
}
