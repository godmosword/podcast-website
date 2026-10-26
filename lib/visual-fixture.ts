/**
 * 視覺回歸專用的凍結資料子集（VIS-DEBT-2）。
 *
 * 視覺測試跑在活資料上時，每出一集、每加一個景點就讓基準失效，只能在「遮掉內容」和
 * 「每月紅一次」之間二選一。開了旗標的 build 只看得到下面這幾集、這幾個景點，
 * 上新集不再動基準；基準只在真的改了樣式時紅。
 *
 * 旗標怎麼來：使用者設 `VISUAL_FIXTURE=1` 跑 build／start，`next.config.ts` 在 build 時把
 * `VISUAL_FIXTURE_BUILD` 寫死進 server 與 client 兩邊的 bundle（client 元件也會呼叫
 * `getStories()`／`listPlaygrounds()`，只在 server 生效會水合不一致），產物放 `.next-visual`、
 * CI 與 Vercel 上直接拒絕。prebuild 的 tsx 腳本看不到 `VISUAL_FIXTURE_BUILD`，照樣產全集。
 */

/** 都已出完多頁插圖，涵蓋 5 個宇宙區；ep-1（故事卡元件快照）與 ep-3（單集頁、播放器）是錨點。 */
export const VISUAL_FIXTURE_STORY_SLUGS = ["ep-1", "ep-3", "ep-5", "ep-6", "ep-18", "ep-22"] as const;

/** 北中南都有、七種類型都有；ty-kids-museum 是景點詳情頁與景點卡快照的錨點。 */
export const VISUAL_FIXTURE_PLACE_IDS = [
  "ty-kids-museum",
  "ty-casti",
  "ty-fenghe",
  "tp-children-park",
  "tp-zoo",
  "hcx-greenworld",
  "tc-nmns",
  "tc-taichung-park",
  "nto-xiangshan",
  "tn-chimei-museum",
  "kh-shoushan-zoo",
  "kh-weiwuying-park",
] as const;

/**
 * 這份 build 是不是凍結資料版。值由 next.config 在 build 時寫死；直接在環境裡設
 * `VISUAL_FIXTURE_BUILD` 是誤用（next.config 會拒絕）。萬一凍結資料跑到 CI 或 Vercel 上，
 * 在這裡就丟錯，寧可整站壞掉被看到，也不要默默只剩 6 集。
 */
export function isVisualFixtureBuild(): boolean {
  const on = process.env.VISUAL_FIXTURE_BUILD === "1";
  if (on && (process.env.CI || process.env.VERCEL)) {
    throw new Error("VISUAL_FIXTURE_BUILD 只能在本機的視覺回歸 build 使用，CI／Vercel 不得開啟。");
  }
  return on;
}

/**
 * 依固定清單挑出子集，保留原本的順序。清單裡有資料找不到的 id 就直接丟錯：
 * 資料改名或下架時要人來換錨點，不能默默少一筆讓基準跟著漂。
 */
export function pickVisualFixture<T>(items: readonly T[], ids: readonly string[], idOf: (item: T) => string): T[] {
  const wanted = new Set(ids);
  const picked = items.filter((item) => wanted.has(idOf(item)));
  const missing = ids.filter((id) => !picked.some((item) => idOf(item) === id));
  if (missing.length > 0) {
    throw new Error(`VISUAL_FIXTURE：資料裡找不到 ${missing.join("、")}，請更新 lib/visual-fixture.ts 的固定清單。`);
  }
  return picked;
}
