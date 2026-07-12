/** Landing Hub 四段 segment 定義（Storyline 式 IA）。 */

export type LandingSegmentId = "stories" | "bedtime" | "clay" | "health";

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
  /** 標題下一行副標（≤18 字；僅需要說明身分的段落使用）。 */
  subtitle?: string;
  /** 播放直達鈕：latest＝最新一集、bedtime＝睡前主題一集（resolve 時決定目標）。 */
  playCta?: "latest" | "bedtime";
  /** 睡前夜色疊層在本段隱藏月亮（美術自帶月亮或室內場景）。 */
  hideBedtimeMoon?: boolean;
  /** 特定美術的夜色調色策略；warm-bottom 保留底部粉彩暖色。 */
  bedtimeVeil?: "warm-bottom";
};

export const LANDING_SEGMENT_IDS: LandingSegmentId[] = [
  "stories",
  "bedtime",
  "clay",
  "health",
];

export const LANDING_SEGMENTS: LandingSegmentDef[] = [
  {
    id: "stories",
    anchorId: "segment-stories",
    title: "車車與遊樂園的故事",
    subtitle: "3–7 歲親子 Podcast · 每集約 5–10 分鐘",
    heroImage: "/landing/segment-stories.jpg",
    heroImagePortrait: "/landing/segment-stories-portrait.jpg",
    cta: { label: "全部故事", href: "/stories" },
    playCta: "latest",
  },
  {
    id: "bedtime",
    anchorId: "segment-bedtime",
    title: "數綿羊 ·\n睡前收聽好好睡",
    heroImage: "/landing/segment-bedtime.jpg",
    heroImagePortrait: "/landing/segment-bedtime-portrait.jpg",
    cta: { label: "睡前故事", href: "/topic/睡前" },
    playCta: "bedtime",
    hideBedtimeMoon: true,
  },
  {
    id: "clay",
    anchorId: "segment-clay",
    title: "捏黏土 ·\n練習精細動作",
    heroImage: "/landing/segment-clay.jpg",
    heroImagePortrait: "/landing/segment-clay-portrait.jpg",
    cta: {
      label: "YouTube 捏黏土",
      href: "https://www.youtube.com/playlist?list=PLVbyl20K8lOeuJ2ky6dEsmpew7xAxZDhF",
      external: true,
    },
    hideBedtimeMoon: true,
  },
  {
    id: "health",
    anchorId: "segment-health",
    title: "陪孩子建立好習慣",
    heroImage: "/landing/segment-health.jpg",
    heroImagePortrait: "/landing/segment-health-portrait.jpg",
    cta: { label: "安全與習慣", href: "/topic/安全" },
    bedtimeVeil: "warm-bottom",
  },
];

/** 捏黏土 segment 外連卡片（URL 可後續替換為專屬影片）。 */
export const LANDING_CLAY_EXTERNAL = {
  title: "跟 Bonbon & 馬米捏車車",
  subtitle: "YouTube 親子手作",
  href: "https://www.youtube.com/playlist?list=PLVbyl20K8lOeuJ2ky6dEsmpew7xAxZDhF",
  image: "/mascot.png",
} as const;
