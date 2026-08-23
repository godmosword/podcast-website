/**
 * 親子遊樂地圖結果摘要文案。
 * 手機首屏只講一次範圍＋筆數，避免「地點清單／全台資料庫／適合親子出遊」三套說法。
 */
import type { PlaygroundType } from "@/data/playgrounds";

export function playMapResultTitle(args: {
  count: number;
  city: string | null;
  nearbyActive: boolean;
  viewportSearchActive: boolean;
}): string {
  const { count, city, nearbyActive, viewportSearchActive } = args;
  if (viewportSearchActive) return `這個區域・${count} 個適合的地方`;
  if (nearbyActive) return `附近・${count} 個適合的地方`;
  if (city) return `${city}・${count} 個適合的地方`;
  return `全台・${count} 個適合的地方`;
}

/**
 * 句子式結果列的檢視模型。結果數是家長最先要的資訊，所以拆成獨立欄位
 * 讓消費端可以單獨放大，不必從整串字裡挖數字。
 */
export type PlayMapResultSentenceView = {
  /** 「全台」「桃園市」「你附近」「這個區域」 */
  scopeLabel: string;
  /** 已套用的條件；空陣列＝不限條件。 */
  facetLabels: readonly string[];
  count: number;
  countLabel: string;
  /** h2 的 accessible name；視覺上拆成多段，讀屏要讀成一句。 */
  srText: string;
};

export type PlayMapResultSentenceArgs = {
  count: number;
  city: string | null;
  nearbyActive: boolean;
  viewportSearchActive: boolean;
  freeOnly: boolean;
  indoorOnly: boolean;
  outdoorOnly: boolean;
  rainyDayOnly: boolean;
  parkingOnly: boolean;
  strollerFriendlyOnly: boolean;
  highEnergyOnly: boolean;
  type: PlaygroundType | null;
};

function scopeLabelOf(args: PlayMapResultSentenceArgs): string {
  if (args.viewportSearchActive) return "這個區域";
  if (args.nearbyActive) return "你附近";
  if (args.city) return args.city;
  return "全台";
}

/** 顯示順序固定，讓同一組條件永遠讀成同一句話。 */
function facetLabelsOf(args: PlayMapResultSentenceArgs): string[] {
  const labels: string[] = [];
  if (args.freeOnly) labels.push("免費");
  if (args.rainyDayOnly) labels.push("雨天");
  if (args.highEnergyOnly) labels.push("放電");
  if (args.indoorOnly) labels.push("室內");
  if (args.outdoorOnly) labels.push("戶外");
  if (args.parkingOnly) labels.push("好停車");
  if (args.strollerFriendlyOnly) labels.push("推車 OK");
  if (args.type) labels.push(args.type);
  return labels;
}

export function playMapResultSentence(
  args: PlayMapResultSentenceArgs,
): PlayMapResultSentenceView {
  const scopeLabel = scopeLabelOf(args);
  const facetLabels = facetLabelsOf(args);
  const countLabel = `${args.count} 個地方`;
  const facetText =
    facetLabels.length > 0 ? `找${facetLabels.join("、")}的地方` : "找地方";

  return {
    scopeLabel,
    facetLabels,
    count: args.count,
    countLabel,
    srText: `在${scopeLabel}${facetText}，共 ${countLabel}`,
  };
}
