/** 線上著色本：角色八頁、故事畫面八頁。安安出任務仍是舊細線稿。 */
import type { ZoneId } from "@/data/universe-zones";

export type ColoringPageKind = "character" | "scene";

export type ColoringPage = {
  id: string;
  lineArtRevision: number;
  variant?: "simple";
  storySlug?: string;
  activity?: string;
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
  /**
   * AI 線稿重生時附的角色定裝照（相對於 public/）。
   * scene 頁必填（維持出場角色 on-model）；character 頁的 sourcePath 本身即定裝照可省略。
   */
  referencePaths?: readonly string[];
};

export const COLORING_PAGES: readonly ColoringPage[] = [
  {
    id: "char-小紅賽車",
    storySlug: "ep-3",
    activity: "幫小紅設計一臺彩虹賽車，顏色由你決定！",
    lineArtRevision: 3,
    title: "小紅賽車",
    kind: "character",
    sourcePath: "characters/小紅賽車.jpg",
    lineArtSrc: "/coloring/char-小紅賽車/line.png",
    previewSrc: "/characters/小紅賽車.jpg",
  },
  {
    id: "char-恐龍車多多",
    storySlug: "ep-9",
    activity: "幫多多和牙刷換上新顏色，牙齒也可以塗成你喜歡的樣子！",
    lineArtRevision: 3,
    title: "恐龍車多多",
    kind: "character",
    sourcePath: "characters/恐龍車多多.jpg",
    lineArtSrc: "/coloring/char-恐龍車多多/line.png",
    previewSrc: "/characters/恐龍車多多.jpg",
  },
  {
    id: "char-安安救護車",
    storySlug: "ep-6",
    activity: "幫安安和救護燈換上你喜歡的顏色！",
    lineArtRevision: 3,
    title: "安安救護車",
    kind: "character",
    sourcePath: "characters/安安救護車.jpg",
    lineArtSrc: "/coloring/char-安安救護車/line.png",
    previewSrc: "/characters/安安救護車.jpg",
  },
  {
    id: "char-鈴鈴清潔車",
    storySlug: "ep-4",
    activity: "幫鈴鈴和掃把刷刷換上新顏色！",
    lineArtRevision: 3,
    title: "鈴鈴清潔車",
    kind: "character",
    sourcePath: "characters/鈴鈴清潔車.jpg",
    lineArtSrc: "/coloring/char-鈴鈴清潔車/line.png",
    previewSrc: "/characters/鈴鈴清潔車.jpg",
  },
  {
    id: "char-猛猛",
    storySlug: "ep-8",
    activity: "幫猛猛的大輪胎塗上你喜歡的顏色！",
    lineArtRevision: 1,
    title: "猛猛",
    kind: "character",
    sourcePath: "characters/猛猛.jpg",
    lineArtSrc: "/coloring/char-猛猛/line.png",
    previewSrc: "/characters/猛猛.jpg",
  },
  {
    id: "char-東東挖土機",
    storySlug: "ep-5",
    activity: "幫東東的挖斗和履帶換上新顏色！",
    lineArtRevision: 1,
    title: "東東挖土機",
    kind: "character",
    sourcePath: "characters/東東挖土機.jpg",
    lineArtSrc: "/coloring/char-東東挖土機/line.png",
    previewSrc: "/characters/東東挖土機.jpg",
  },
  {
    id: "char-亮亮警車",
    storySlug: "ep-12",
    activity: "幫亮亮的星星和車頂燈換上新顏色！",
    lineArtRevision: 1,
    title: "亮亮警車",
    kind: "character",
    sourcePath: "characters/亮亮警車.jpg",
    lineArtSrc: "/coloring/char-亮亮警車/line.png",
    previewSrc: "/characters/亮亮警車.jpg",
  },
  {
    id: "char-噗噗豬",
    storySlug: "ep-16",
    activity: "幫噗噗豬的水砲和救生圈換上新顏色！",
    lineArtRevision: 1,
    title: "噗噗豬",
    kind: "character",
    sourcePath: "characters/噗噗豬.jpg",
    lineArtSrc: "/coloring/char-噗噗豬/line.png",
    previewSrc: "/characters/噗噗豬.jpg",
  },
  {
    id: "scene-ep-3-05",
    storySlug: "ep-3",
    lineArtRevision: 3,
    title: "小紅賽車的練習場",
    kind: "scene",
    sourcePath: "stories/ep-3/05.jpg",
    lineArtSrc: "/coloring/scene-ep-3-05/line.png",
    previewSrc: "/stories/ep-3/05.jpg",
    zoneId: "car-park",
    referencePaths: ["characters/小紅賽車.jpg"],
  },
  {
    id: "scene-ep-9-05",
    storySlug: "ep-9",
    activity: "幫多多和牙刷換上你喜歡的顏色，再看看刷牙的故事！",
    lineArtRevision: 3,
    title: "恐龍車多多的大黃牙",
    kind: "scene",
    sourcePath: "stories/ep-9/05.jpg",
    lineArtSrc: "/coloring/scene-ep-9-05/line.png",
    previewSrc: "/stories/ep-9/05.jpg",
    zoneId: "dino",
    referencePaths: ["characters/恐龍車多多.jpg"],
  },
  {
    id: "scene-ep-6-05",
    storySlug: "ep-6",
    lineArtRevision: 2,
    title: "安安救護車出任務",
    kind: "scene",
    sourcePath: "stories/ep-6/05.jpg",
    lineArtSrc: "/coloring/scene-ep-6-05/line.png",
    previewSrc: "/stories/ep-6/05.jpg",
    zoneId: "rescue",
    referencePaths: ["characters/安安救護車.jpg"],
  },
  {
    id: "scene-ep-16-05",
    storySlug: "ep-16",
    lineArtRevision: 3,
    title: "噗噗豬的水上樂園",
    kind: "scene",
    sourcePath: "stories/ep-16/05.jpg",
    lineArtSrc: "/coloring/scene-ep-16-05/line.png",
    previewSrc: "/stories/ep-16/05.jpg",
    zoneId: "ocean",
    referencePaths: ["characters/噗噗豬.jpg"],
  },
  {
    id: "scene-ep-4-05",
    storySlug: "ep-4",
    lineArtRevision: 1,
    title: "鈴鈴清潔車掃大街",
    kind: "scene",
    sourcePath: "stories/ep-4/05.jpg",
    lineArtSrc: "/coloring/scene-ep-4-05/line.png",
    previewSrc: "/stories/ep-4/05.jpg",
    zoneId: "car-park",
    referencePaths: ["characters/鈴鈴清潔車.jpg"],
  },
  {
    id: "scene-ep-8-05",
    storySlug: "ep-8",
    lineArtRevision: 1,
    title: "猛猛輕輕開",
    kind: "scene",
    sourcePath: "stories/ep-8/05.jpg",
    lineArtSrc: "/coloring/scene-ep-8-05/line.png",
    previewSrc: "/stories/ep-8/05.jpg",
    zoneId: "dino",
    referencePaths: ["characters/猛猛.jpg"],
  },
  {
    id: "scene-ep-12-07",
    storySlug: "ep-12",
    lineArtRevision: 1,
    title: "亮亮警車護送小巴士",
    kind: "scene",
    sourcePath: "stories/ep-12/07.jpg",
    lineArtSrc: "/coloring/scene-ep-12-07/line.png",
    previewSrc: "/stories/ep-12/07.jpg",
    zoneId: "rescue",
    referencePaths: ["characters/亮亮警車.jpg", "characters/小藍巴士.jpg"],
  },
  {
    id: "scene-ep-5-05",
    storySlug: "ep-5",
    activity: "幫東東的土堆和挖斗換上新顏色！",
    lineArtRevision: 1,
    title: "東東挖土機的工地",
    kind: "scene",
    sourcePath: "stories/ep-5/05.jpg",
    lineArtSrc: "/coloring/scene-ep-5-05/line.png",
    previewSrc: "/stories/ep-5/05.jpg",
    zoneId: "forest",
    referencePaths: ["characters/東東挖土機.jpg"],
  },
] as const;

export const COLORING_PAGE_IDS = COLORING_PAGES.map((page) => page.id);
