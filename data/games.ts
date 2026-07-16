type AgeBand = "explore" | "challenge";

export type GameType = "match" | "adventure" | "blocks" | "racing" | "coloring";

export type GameArt = {
  cover: string;
  thumbnail?: string;
  position?: string;
  alt: string;
};

/** 首玩教學示範的手勢圖示種類：對應 TutorialOverlay 內建 inline SVG。 */
export type TutorialGesture = "tap" | "swipe" | "hold" | "arrows";

/** 單步教學：一個手勢圖示 + 一句 ≤10 字說明。 */
export type TutorialStep = {
  text: string;
  gesture: TutorialGesture;
};

/** UX-P0-4：challenge 遊戲列表卡家長提示（僅文案，不隱藏入口）。 */
export const CHALLENGE_PARENT_TIP = "建議 6 歲以上 · 家長陪同" as const;

export type GameMeta = {
  slug: string;
  title: string;
  desc: string;
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
    slug: "car-adventure",
    title: "車車大冒險",
    desc: "橫向跑跳過關：吃金幣、踩搗蛋車、躲尖刺、衝向終點旗。",
    href: "/games/car-adventure",
    emoji: "🏁",
    accent: "var(--c-sky)",
    ageBand: "challenge",
    ageRange: "6–12 歲",
    estMinutes: 8,
    hasScore: true,
    hasTimer: false,
    gameType: "adventure",
    controls: ["左右移動", "跳躍過關"],
    art: {
      cover: "/games/v2/car-adventure/cover.webp",
      thumbnail: "/games/v2/car-adventure/cover.webp",
      alt: "黃色黏土車車在遊樂園平台間跳躍並收集金幣",
    },
    tutorial: [
      { text: "按住按鈕左右移動", gesture: "hold" },
      { text: "點一下跳起來", gesture: "tap" },
      { text: "衝向終點旗", gesture: "swipe" },
    ],
  },
  {
    slug: "block-drop",
    title: "繽紛樂園",
    desc: "黏土糖果風落下方塊，排滿整行就消除。",
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
      { text: "排滿一整行就消除", gesture: "hold" },
    ],
  },
  {
    slug: "candy-kart",
    title: "繽紛卡丁車",
    desc: "馬卡龍黏土風卡丁車：6 條糖果賽道、漂移收星星，爭奪繽紛糖果盃！",
    href: "/games/candy-kart",
    emoji: "🍬",
    accent: "var(--c-pink)",
    ageBand: "challenge",
    ageRange: "6–12 歲",
    estMinutes: 4,
    hasScore: true,
    hasTimer: true,
    gameType: "racing",
    controls: ["左右轉向", "漂移收星星"],
    art: {
      cover: "/games/v2/candy-kart/cover.webp",
      thumbnail: "/games/v2/candy-kart/cover.webp",
      alt: "粉紅黏土卡丁車在遊樂園賽道上漂移競速",
    },
    tutorial: [
      { text: "左右滑動轉方向", gesture: "swipe" },
      { text: "按住加速衝刺", gesture: "hold" },
      { text: "過彎收集星星", gesture: "tap" },
    ],
  },
  {
    slug: "coloring-book",
    title: "繪本著色",
    desc: "選定裝人物或故事場景線稿，用蠟筆與油漆桶輕輕塗上喜歡的顏色！",
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
      { text: "油漆桶一次填滿", gesture: "hold" },
    ],
  },
];

/** challenge 遊戲回傳家長提示文案；explore 不回傳。 */
export function gameParentTip(game: GameMeta): string | null {
  return game.ageBand === "challenge" ? CHALLENGE_PARENT_TIP : null;
}
