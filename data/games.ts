type AgeBand = "explore" | "challenge";

type GameType = "match" | "blocks" | "coloring";

type GameArt = {
  cover: string;
  thumbnail?: string;
  position?: string;
  alt: string;
};

/** 首玩教學示範的手勢圖示種類：對應 TutorialOverlay 內建 inline SVG。 */
type TutorialGesture = "tap" | "swipe" | "hold" | "arrows";

/** 單步教學：一個手勢圖示 + 一句 ≤10 字說明。 */
export type TutorialStep = {
  text: string;
  gesture: TutorialGesture;
};

/** UX-P0-4：challenge 遊戲列表卡家長提示（僅文案，不隱藏入口）。 */
export const CHALLENGE_PARENT_TIP = "爸媽陪玩更有趣" as const;

export type GameMeta = {
  slug: string;
  title: string;
  desc: string;
  /** Hub 主打卡短情緒句（≤14 字）。 */
  teaser: string;
  href: string;
  emoji: string;
  accent: string;
  ageBand: AgeBand;
  ageRange: string;
  estMinutes: number;
  hasScore: boolean;
  hasTimer: boolean;
  gameType: GameType;
  controls: readonly string[];
  art: GameArt;
  featured?: boolean;
  /** 首玩教學示範 overlay 的步驟資料（2–3 步）。 */
  tutorial: readonly TutorialStep[];
};

export const GAMES: GameMeta[] = [
  {
    slug: "candy-match",
    title: "繽紛消消樂",
    desc: "小朋友的第一款消除遊戲：找一找、排一排、消一消，完成繽紛任務！",
    teaser: "找一樣的，消掉它！",
    href: "/games/candy-match",
    emoji: "🍭",
    accent: "var(--c-pink)",
    ageBand: "explore",
    ageRange: "3–7 歲",
    estMinutes: 5,
    hasScore: false,
    hasTimer: false,
    gameType: "match",
    controls: ["點兩格交換", "拖曳也可以"],
    art: {
      cover: "/games/v2/candy-match/cover.webp",
      thumbnail: "/games/v2/candy-match/cover.webp",
      alt: "粉紅黏土遊樂園裡的繽紛消消樂方塊與車車",
    },
    featured: true,
    tutorial: [
      { text: "點兩個相鄰的圖案", gesture: "tap" },
      { text: "三個一樣就消除", gesture: "tap" },
    ],
  },
  {
    slug: "block-drop",
    title: "繽紛樂園",
    desc: "黏土糖果風落下方塊，排滿整行就消除。",
    teaser: "排滿一行就消掉！",
    href: "/games/block-drop",
    emoji: "🧩",
    accent: "var(--c-pink)",
    ageBand: "challenge",
    ageRange: "6–12 歲",
    estMinutes: 10,
    hasScore: true,
    hasTimer: false,
    gameType: "blocks",
    controls: ["左右移動", "旋轉與落下"],
    art: {
      cover: "/games/v2/block-drop/cover.webp",
      thumbnail: "/games/v2/block-drop/cover.webp",
      alt: "黏土遊樂園裡的繽紛方塊正在堆疊",
    },
    tutorial: [
      { text: "左右滑動移動方塊", gesture: "swipe" },
      { text: "點一下旋轉方塊", gesture: "tap" },
      { text: "往下滑快快落下", gesture: "swipe" },
    ],
  },
  {
    slug: "coloring-book",
    title: "繪本著色",
    desc: "選定裝人物或故事場景線稿，用蠟筆與油漆桶輕輕塗上喜歡的顏色！",
    teaser: "選顏色，塗一塗！",
    href: "/games/coloring-book",
    emoji: "🖍️",
    accent: "var(--c-sky)",
    ageBand: "explore",
    ageRange: "3–7 歲",
    estMinutes: 8,
    hasScore: false,
    hasTimer: false,
    gameType: "coloring",
    controls: ["選顏色塗一塗", "油漆桶一次填滿"],
    art: {
      cover: "/games/v2/coloring-book/cover.webp",
      thumbnail: "/games/v2/coloring-book/cover.webp",
      position: "50% 48%",
      alt: "小紅賽車和恐龍車多多圍著翻開的著色繪本，拿蠟筆一起塗顏色",
    },
    tutorial: [
      { text: "點顏色選一種", gesture: "tap" },
      { text: "點線稿塗上顏色", gesture: "tap" },
      { text: "油漆桶一次填滿", gesture: "tap" },
    ],
  },
];

/** 遊樂園動線：玩完 A 建議去 B。 */
export const GAME_NEXT: Record<string, string> = {
  "candy-match": "coloring-book",
  "coloring-book": "candy-match",
  "block-drop": "candy-match",
};

/** 依 slug 取下一站遊戲；找不到回 null。 */
export function getNextGame(slug: string): GameMeta | null {
  const next = GAME_NEXT[slug];
  if (!next) return null;
  return GAMES.find((game) => game.slug === next) ?? null;
}

/** challenge 遊戲回傳家長提示文案；explore 不回傳。 */
export function gameParentTip(game: GameMeta): string | null {
  return game.ageBand === "challenge" ? CHALLENGE_PARENT_TIP : null;
}
