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
  {
    id: "kart",
    title: "車車卡丁車",
    desc: "3D arcade 漂移卡丁車：甩尾蓄力、迷你加速，在橢圓賽道競速。",
    href: "/games/kart",
    emoji: "🏎️",
    accent: "var(--c-yellow)",
    ageRange: "5–12 歲",
  },
  {
    id: "pirate-kart",
    title: "海盜卡丁車大賽",
    desc: "16-bit 熱帶海盜賽車：張帆加速、大砲射擊，搶寶藏跑三圈！",
    href: "/games/pirate-kart",
    emoji: "🏴‍☠️",
    accent: "var(--c-sky)",
    ageRange: "5–12 歲",
  },
];
