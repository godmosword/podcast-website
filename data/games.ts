export type AgeBand = "explore" | "challenge";

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
    slug: "kart",
    title: "車車卡丁車",
    desc: "3D arcade 漂移卡丁車：甩尾蓄力、迷你加速，在橢圓賽道競速。",
    href: "/games/kart",
    emoji: "🏎️",
    accent: "var(--c-yellow)",
    ageBand: "challenge",
    ageRange: "6–12 歲",
    estMinutes: 5,
    hasScore: false,
    hasTimer: true,
  },
  {
    slug: "pirate-kart",
    title: "海盜卡丁車大賽",
    desc: "16-bit 熱帶海盜賽車：張帆加速、大砲射擊，搶寶藏跑三圈！",
    href: "/games/pirate-kart",
    emoji: "🏴‍☠️",
    accent: "var(--c-sky)",
    ageBand: "challenge",
    ageRange: "6–12 歲",
    estMinutes: 6,
    hasScore: false,
    hasTimer: true,
  },
];

export function gamesByAgeBand(band: AgeBand): GameMeta[] {
  return GAMES.filter((g) => g.ageBand === band);
}
