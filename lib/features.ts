/**
 * 集中式 Feature Flags（build-time 定值，SSG 相容）。
 *
 * ## 實驗功能三要件
 * 1. **flag** — 在此註冊 `FEATURES.*`
 * 2. **module** — 邏輯獨立成 `components/` 或 `lib/` 模組
 * 3. **data** — 內容由 `data/*` 驅動，不硬編在 route
 *
 * 覆寫：`NEXT_PUBLIC_FEATURE_<SUFFIX>`（`1`/`true` 開、`0`/`false` 關；未設用預設）。
 */

/** 讀取 build-time 環境變數，解析為 boolean。 */
export function flag(envSuffix: string, defaultValue: boolean): boolean {
  const raw = process.env[`NEXT_PUBLIC_FEATURE_${envSuffix}`];
  if (raw === undefined || raw === "") return defaultValue;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "1" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return defaultValue;
}

export const FEATURES = {
  nightMode: flag("NIGHT_MODE", true),
  starterEpisodes: flag("STARTER_EPISODES", true),
  reflectionPrompt: flag("REFLECTION_PROMPT", true),
  goodnightButton: flag("GOODNIGHT_BUTTON", false),
} as const;

export type FeatureKey = keyof typeof FEATURES;
