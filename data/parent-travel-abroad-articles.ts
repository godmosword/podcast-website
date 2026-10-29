/**
 * 家長區「親子出國」。
 *
 * 方格子文末有「同步更新至親子出國專欄」（可含空白、引號、標點）時，
 * `npm run sync:vocus` 把那篇收進這個陣列，不進 `data/parent-articles.ts`。
 * 閱讀順序＝陣列順序；多篇時較早發布的在前。列表頁另外依發布日新到舊顯示。
 * 不要在 `PARENT_TRAVEL_ABROAD_ARTICLES` 之後再加陣列（同步用最後一個 `];` 定位）。
 *
 * 圖片與育兒文章共用 `public/parent-articles/`，搬走時不用改路徑。
 * 型別與育兒文章相同，見 `data/parent-articles.ts`。
 */
import type { ParentArticle } from "./parent-articles";

/** 還沒有從方格子同步進來的文章時保持空陣列，列表頁會顯示「內容整理中」。 */
export const PARENT_TRAVEL_ABROAD_ARTICLES: readonly ParentArticle[] = [
];
