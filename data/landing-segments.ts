/** Landing Hub segment 定義（Storyline 式 IA）。首頁只渲染 LANDING_PAGE_SEGMENT_IDS。 */

export type LandingSegmentId = "stories" | "health";

export type LandingSegmentDef = {
  id: LandingSegmentId;
  /** section 錨點 */
  anchorId: string;
  /** 標題；可含 `\n` 手動斷行（CJK 逐字斷行會拆散「遊樂園」等詞，斷行點由資料控制）。 */
  title: string;
  /** 橫版 hero（桌面）；approve 後為 /landing/segment-{id}.jpg */
  heroImage: string;
  /** 直版 hero（行動 ≤768px）；approve 後為 /landing/segment-{id}-portrait.jpg */
  heroImagePortrait: string;
  cta: {
    label: string;
    href: string;
    external?: boolean;
  };
  /** 段落短標。ADR-0004 移除首頁底列導覽後，消費者是宇宙地圖的車庫連結
   *  （lib/universe-map.ts 的 getCarParkLinks），不是 Landing 自己。 */
  navLabel: string;
  /** 標題下一行副標（≤18 字；僅需要說明身分的段落使用）。 */
  subtitle?: string;
  /** 播放直達鈕：latest＝最新一集、bedtime＝睡前主題一集（resolve 時決定目標）。 */
  playCta?: "latest" | "bedtime";
  /** 睡前夜色疊層在本段隱藏月亮（美術自帶月亮或室內場景）。 */
  hideBedtimeMoon?: boolean;
  /** 特定美術的夜色調色策略；warm-bottom 保留底部粉彩暖色。 */
  bedtimeVeil?: "warm-bottom";
};

export const LANDING_SEGMENT_IDS: LandingSegmentId[] = ["stories", "health"];

/** 首頁直向分段，與車庫連結同一份名單。 */
export const LANDING_PAGE_SEGMENT_IDS: readonly LandingSegmentId[] =
  LANDING_SEGMENT_IDS;

export const LANDING_SEGMENTS: LandingSegmentDef[] = [
  {
    id: "stories",
    anchorId: "segment-stories",
    title: "車車與遊樂園的故事",
    heroImage: "/landing/segment-stories.jpg",
    heroImagePortrait: "/landing/segment-stories-portrait.jpg",
    cta: { label: "車車遊樂園的故事", href: "/stories" },
    navLabel: "車車故事",
  },
  {
    id: "health",
    anchorId: "segment-health",
    title: "陪孩子建立好習慣",
    heroImage: "/landing/segment-health.jpg",
    heroImagePortrait: "/landing/segment-health-portrait.jpg",
    // 故事搜尋器的主題「生活好習慣」（見 data/episode-themes.ts），一次列出全部這類故事。
    cta: { label: "好習慣故事", href: "/stories?tag=生活好習慣" },
    navLabel: "好習慣",
    bedtimeVeil: "warm-bottom",
  },
];
