/**
 * 《多多壽司屋》難度自動調整（SPEC #223 第 6 項，A 案）：不加選單、不加存檔欄位、不動星星。
 * 檔位只放在記憶體：起始檔看既有星星，一輪結束依一次做對幾單升降，重新整理就回起始檔。
 */

export type OrderTier = "easy" | "normal" | "advanced";

const TIER_ORDER: readonly OrderTier[] = ["easy", "normal", "advanced"];

/** 每單幾樣料。一般檔就是原本的 1、1、2、2、3（視覺測試的 seed 7 不變）。 */
export const TIER_SIZES: Record<OrderTier, readonly number[]> = {
  easy: [1, 1, 1, 2, 2],
  normal: [1, 1, 2, 2, 3],
  advanced: [2, 2, 3, 3, 3],
};

/** 閒置多久亮下一步提示（一般與輕鬆）。 */
export const BASE_IDLE_HINT_MS = 4_500;
const ADVANCED_IDLE_HINT_MS = 7_000;

const TOP_STARS = 3;
const ALL_FIRST_TRY = 5;
const STRUGGLED_AT_MOST = 2;

/** 拿過 3 星就從進階開始，否則一般。 */
export function startTier(starsGot: number): OrderTier {
  return starsGot >= TOP_STARS ? "advanced" : "normal";
}

/** 一輪 5 單都一次做對升一檔；一次做對 ≤2 單降一檔；其他不變。到頂、到底不再動。 */
export function nextTier(tier: OrderTier, firstTryCount: number): OrderTier {
  const at = TIER_ORDER.indexOf(tier);
  if (firstTryCount >= ALL_FIRST_TRY) return TIER_ORDER[Math.min(at + 1, TIER_ORDER.length - 1)]!;
  if (firstTryCount <= STRUGGLED_AT_MOST) return TIER_ORDER[Math.max(at - 1, 0)]!;
  return tier;
}

/** 進階等久一點才亮提示。 */
export function idleHintMs(tier: OrderTier): number {
  return tier === "advanced" ? ADVANCED_IDLE_HINT_MS : BASE_IDLE_HINT_MS;
}

/** 首單教學手指只在一般以下出現。 */
export function teachesFirstOrder(tier: OrderTier): boolean {
  return tier !== "advanced";
}
