type AgeBand = "explore" | "challenge";

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
  },
];

/** challenge 遊戲回傳家長提示文案；explore 不回傳。 */
export function gameParentTip(game: GameMeta): string | null {
  return game.ageBand === "challenge" ? CHALLENGE_PARENT_TIP : null;
}
