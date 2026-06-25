/** Landing Hub 四段 segment 定義（Storyline 式 IA）。 */

export type LandingSegmentId = "stories" | "bedtime" | "clay" | "health";

export type LandingSegmentDef = {
  id: LandingSegmentId;
  /** section 錨點 */
  anchorId: string;
  title: string;
  subtitle: string;
  /** 橫版 hero（桌面）；approve 後為 /landing/segment-{id}.jpg */
  heroImage: string;
  /** 直版 hero（行動 ≤768px）；approve 後為 /landing/segment-{id}-portrait.jpg */
  heroImagePortrait: string;
  cta: {
    label: string;
    href: string;
    external?: boolean;
  };
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
    title: "車車故事 · 適合 3–7 歲",
    subtitle: "看圖聽故事，每天一個車車冒險",
    heroImage: "/landing/segment-stories.jpg",
    heroImagePortrait: "/landing/segment-stories-portrait.jpg",
    cta: { label: "全部故事", href: "/stories" },
  },
  {
    id: "bedtime",
    anchorId: "segment-bedtime",
    title: "數綿羊 · 睡前收聽讓孩子好睡",
    subtitle: "溫柔語調，適合睡前親子共聽",
    heroImage: "/landing/segment-bedtime.jpg",
    heroImagePortrait: "/landing/segment-bedtime-portrait.jpg",
    cta: { label: "睡前故事", href: "/topic/睡前" },
  },
  {
    id: "clay",
    anchorId: "segment-clay",
    title: "捏黏土 · 多玩 30 分鐘練精細動作",
    subtitle: "跟著影片動手做，離開螢幕也開心",
    heroImage: "/landing/segment-clay.jpg",
    heroImagePortrait: "/landing/segment-clay-portrait.jpg",
    cta: {
      label: "YouTube 捏黏土",
      href: "https://www.youtube.com/playlist?list=PLVbyl20K8lOeuJ2ky6dEsmpew7xAxZDhF",
      external: true,
    },
  },
  {
    id: "health",
    anchorId: "segment-health",
    title: "衛教宣導 · 陪伴孩子重點宣導",
    subtitle: "刷牙、交通安全與生活好習慣",
    heroImage: "/landing/segment-health.jpg",
    heroImagePortrait: "/landing/segment-health-portrait.jpg",
    cta: { label: "安全與習慣", href: "/topic/安全" },
  },
];

export function getLandingSegmentById(
  id: LandingSegmentId,
): LandingSegmentDef | undefined {
  return LANDING_SEGMENTS.find((s) => s.id === id);
}

/** 捏黏土 segment 外連卡片（URL 可後續替換為專屬影片）。 */
export const LANDING_CLAY_EXTERNAL = {
  title: "跟 Bonbon & 馬米捏車車",
  subtitle: "YouTube 親子手作",
  href: "https://www.youtube.com/playlist?list=PLVbyl20K8lOeuJ2ky6dEsmpew7xAxZDhF",
  image: "/mascot.png",
} as const;
