export type GameCatalogEntry = {
  id: string;
  title: string;
  desc: string;
  href: string;
  emoji: string;
  accent: string;
};

export const GAMES: GameCatalogEntry[] = [
  {
    id: "car-star",
    title: "車車吃星星",
    desc: "和故事裡的車車朋友一起吃星星、躲追逐車，適合 3–7 歲。",
    href: "/games/car-star",
    emoji: "🚗",
    accent: "var(--c-yellow)",
  },
  {
    id: "car-mission",
    title: "怪獸卡車的溫柔任務",
    desc: "慢慢開、輕輕對待螢火蟲，練習溫柔駕駛的小任務。",
    href: "/games/car-mission",
    emoji: "🚚",
    accent: "var(--c-pink)",
  },
];
