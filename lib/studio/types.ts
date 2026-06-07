/** 單一平台指標（由 API 或手動寫入 studio-metrics.json）。 */
export type PlatformMetrics = {
  platformId: string;
  plays?: number;
  listeners?: number;
  followers?: number;
  /** 0–1，例如 0.42 表示 42% 完聽率 */
  completionRate?: number;
  periodLabel?: string;
  updatedAt?: string;
  source: "api" | "manual";
};

/** data/studio-metrics.json 結構。 */
export type StudioMetricsFile = {
  updatedAt: string | null;
  platforms: PlatformMetrics[];
};
