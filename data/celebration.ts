/** 慶祝事件語意（跨 runtime 共用，不含呈現細節）。 */

export type CelebrationEventId =
  | "favorite_added"
  | "island_open_tap"
  | "story_end"
  | "zone_full_stars";

export type CelebrationIntensity = "whisper" | "spark" | "burst";

export const CELEBRATION_INTENSITY_BY_EVENT: Record<
  CelebrationEventId,
  CelebrationIntensity
> = {
  favorite_added: "spark",
  island_open_tap: "spark",
  story_end: "whisper",
  zone_full_stars: "whisper",
};

/** 同強度連發冷卻（毫秒）。 */
export const CELEBRATION_COOLDOWN_MS: Record<CelebrationIntensity, number> = {
  whisper: 800,
  spark: 1400,
  burst: 3200,
};

/** 同事件合併視窗：視為重複觸發。 */
export const CELEBRATION_MERGE_WINDOW_MS = 700;

/** burst 強度全站預算（兒童注意力保護）。 */
export const CELEBRATION_BURST_BUDGET_WINDOW_MS = 12_000;
export const CELEBRATION_BURST_BUDGET_MAX = 4;

/** 各強度粒子數（DOM adapter）。 */
export const CELEBRATION_PARTICLE_COUNT: Record<CelebrationIntensity, number> =
  {
    whisper: 0,
    spark: 6,
    burst: 6,
  };
