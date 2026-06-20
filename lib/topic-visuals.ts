export type TopicSymbol =
  | "all"
  | "star"
  | "sprout"
  | "shield"
  | "link"
  | "heart"
  | "check"
  | "habit"
  | "calm"
  | "help"
  | "ask"
  | "flag"
  | "retry"
  | "spark"
  | "dream"
  | "puzzle"
  | "bookmark";

export type TopicVisual = {
  symbol: TopicSymbol;
  bg: string;
  fg: string;
};

const TAG_SYMBOL: Record<string, TopicSymbol> = {
  勇氣: "star",
  勇敢: "star",
  成長: "sprout",
  安全: "shield",
  合作: "link",
  情緒: "heart",
  守信用: "check",
  好習慣: "habit",
  冷靜: "calm",
  助人: "help",
  求助: "ask",
  負責: "flag",
  接受失敗: "retry",
  創意: "spark",
  想像力: "dream",
  解決問題: "puzzle",
};

const PALETTE: Record<
  TopicSymbol,
  { bg: string; fg: string }
> = {
  all: { bg: "#eef1f6", fg: "#7a7268" },
  star: { bg: "#fde8f0", fg: "#d85a8a" },
  sprout: { bg: "#ecf8e4", fg: "#5a9e48" },
  shield: { bg: "#e6f4fb", fg: "#3a8fb5" },
  link: { bg: "#f0ebfa", fg: "#8b6fc9" },
  heart: { bg: "#fde8f0", fg: "#e06b96" },
  check: { bg: "#fff6dc", fg: "#c99212" },
  habit: { bg: "#e4f5f3", fg: "#3a9e96" },
  calm: { bg: "#e6f4fb", fg: "#4a9cc4" },
  help: { bg: "#fde8f0", fg: "#d85a8a" },
  ask: { bg: "#f0ebfa", fg: "#8b6fc9" },
  flag: { bg: "#fff6dc", fg: "#c99212" },
  retry: { bg: "#f0ebfa", fg: "#8b6fc9" },
  spark: { bg: "#fff6dc", fg: "#d4a017" },
  dream: { bg: "#e6f4fb", fg: "#3a8fb5" },
  puzzle: { bg: "#ecf8e4", fg: "#5a9e48" },
  bookmark: { bg: "#eef1f6", fg: "#7a7268" },
};

const FALLBACK_KEYS: TopicSymbol[] = [
  "star",
  "sprout",
  "shield",
  "link",
  "heart",
  "check",
  "habit",
  "calm",
];

function hashTag(tag: string): number {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return h;
}

export function topicVisualFor(tag: string | null): TopicVisual {
  if (tag == null) return { symbol: "all", ...PALETTE.all };
  const symbol = TAG_SYMBOL[tag];
  if (symbol) return { symbol, ...PALETTE[symbol] };
  const fallback = FALLBACK_KEYS[hashTag(tag) % FALLBACK_KEYS.length];
  return { symbol: "bookmark", ...PALETTE[fallback] };
}
