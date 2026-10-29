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

/**
 * 版面範例。正式文章會從方格子同步進來。
 * 合併到正式站之前若還沒有真文章，可以刪掉這篇，頁面會回到「內容整理中」。
 */
export const PARENT_TRAVEL_ABROAD_ARTICLES: readonly ParentArticle[] = [
  {
    slug: "travel-abroad-sample",
    title: "親子出國專欄範例",
    publishedAt: "2026-10-29",
    sourceUrl: "https://vocus.cc/user/6aa4a7adaa92714642f625a3",
    excerpt: "這篇是網站版面範例，用來確認列表與內頁。",
    blocks: [
      { type: "paragraph", text: "這篇是網站版面範例，用來確認列表與內頁。" },
      { type: "spacer" },
      { type: "paragraph", text: "正式文章會從方格子同步進來。" },
      {
        type: "paragraph",
        text: "作者把標記放在文末時，文章會出現在這一區；標記本身不會留在頁面上。",
      },
    ],
  },
];
