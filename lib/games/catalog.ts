export type GameCatalogEntry = {
  id: string;
  title: string;
  desc: string;
  href: string;
  emoji: string;
  accent: string;
  ageRange: string;
};

export const GAMES: GameCatalogEntry[] = [
  {
    id: "car-star",
    title: "車車吃星星",
    desc: "和故事裡的車車朋友一起吃星星、躲追逐車。",
    href: "/games/car-star",
    emoji: "🚗",
    accent: "var(--c-lilac)",
    ageRange: "3–7 歲",
  },
  {
    id: "car-mission",
    title: "怪獸卡車的溫柔任務",
    desc: "慢慢開、輕輕對待螢火蟲，練習溫柔駕駛。",
    href: "/games/car-mission",
    emoji: "🚚",
    accent: "var(--c-mint)",
    ageRange: "3–7 歲",
  },
  {
    id: "car-adventure",
    title: "車車大冒險",
    desc: "橫向跑跳過關：吃金幣、踩搗蛋車、躲尖刺、衝向終點旗。",
    href: "/games/car-adventure",
    emoji: "🏁",
    accent: "var(--c-sky)",
    ageRange: "5–12 歲",
  },
  {
    id: "block-drop",
    title: "繽紛方塊",
    desc: "排滿整行就消除，挑戰最高分。",
    href: "/games/block-drop",
    emoji: "🧩",
    accent: "var(--c-pink)",
    ageRange: "5–12 歲",
  },
];
