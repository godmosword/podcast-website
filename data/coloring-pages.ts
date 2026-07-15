/** 線上著色本策展頁（MVP：8 頁，定裝＋場景）。 */
import type { ZoneId } from "@/data/universe-zones";

export type ColoringPageKind = "character" | "scene";

export type ColoringPage = {
  id: string;
  title: string;
  kind: ColoringPageKind;
  /** 相對於 public/ 的既有 JPG（腳本輸入）。 */
  sourcePath: string;
  /** 線稿公開路徑。 */
  lineArtSrc: string;
  /** 原圖公開路徑（小預覽）。 */
  previewSrc: string;
  /** 場景頁對應樂園 zone。 */
  zoneId?: ZoneId;
};

export const COLORING_PAGES: readonly ColoringPage[] = [
  {
    id: "char-恐龍車多多",
    title: "恐龍車多多",
    kind: "character",
    sourcePath: "characters/恐龍車多多.jpg",
    lineArtSrc: "/coloring/char-恐龍車多多/line.png",
    previewSrc: "/characters/恐龍車多多.jpg",
  },
  {
    id: "char-安安救護車",
    title: "安安救護車",
    kind: "character",
    sourcePath: "characters/安安救護車.jpg",
    lineArtSrc: "/coloring/char-安安救護車/line.png",
    previewSrc: "/characters/安安救護車.jpg",
  },
  {
    id: "char-鈴鈴清潔車",
    title: "鈴鈴清潔車",
    kind: "character",
    sourcePath: "characters/鈴鈴清潔車.jpg",
    lineArtSrc: "/coloring/char-鈴鈴清潔車/line.png",
    previewSrc: "/characters/鈴鈴清潔車.jpg",
  },
  {
    id: "char-小紅賽車",
    title: "小紅賽車",
    kind: "character",
    sourcePath: "characters/小紅賽車.jpg",
    lineArtSrc: "/coloring/char-小紅賽車/line.png",
    previewSrc: "/characters/小紅賽車.jpg",
  },
  {
    id: "scene-ep-3-05",
    title: "小紅賽車的練習場",
    kind: "scene",
    sourcePath: "stories/ep-3/05.jpg",
    lineArtSrc: "/coloring/scene-ep-3-05/line.png",
    previewSrc: "/stories/ep-3/05.jpg",
    zoneId: "car-park",
  },
  {
    id: "scene-ep-9-05",
    title: "恐龍車多多的大黃牙",
    kind: "scene",
    sourcePath: "stories/ep-9/05.jpg",
    lineArtSrc: "/coloring/scene-ep-9-05/line.png",
    previewSrc: "/stories/ep-9/05.jpg",
    zoneId: "dino",
  },
  {
    id: "scene-ep-6-05",
    title: "安安救護車出任務",
    kind: "scene",
    sourcePath: "stories/ep-6/05.jpg",
    lineArtSrc: "/coloring/scene-ep-6-05/line.png",
    previewSrc: "/stories/ep-6/05.jpg",
    zoneId: "rescue",
  },
  {
    id: "scene-ep-16-05",
    title: "噗噗豬的水上樂園",
    kind: "scene",
    sourcePath: "stories/ep-16/05.jpg",
    lineArtSrc: "/coloring/scene-ep-16-05/line.png",
    previewSrc: "/stories/ep-16/05.jpg",
    zoneId: "ocean",
  },
] as const;

export const COLORING_PAGE_IDS = COLORING_PAGES.map((page) => page.id);
