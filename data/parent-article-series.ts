/**
 * 育兒文章系列：列表頁把同一組文章照閱讀順序排在一起。
 *
 * 刻意獨立成檔，不放進 `data/parent-articles.ts`：方格子同步腳本
 * （`appendParentArticleSource`）用該檔最後一個 `];` 當插入點，
 * 後面再多一個陣列，新文就會被插進錯的地方。
 *
 * - `title` 沿用作者原標題的說法，不另外取名。
 * - `slugs` 是閱讀順序；同步進來的新文預設不屬於任何系列。
 */
export type ParentArticleSeries = {
  readonly id: string;
  readonly title: string;
  readonly slugs: readonly string[];
};

export const PARENT_ARTICLE_SERIES: readonly ParentArticleSeries[] = [
  {
    id: "vision-care",
    title: "注意孩子的視力",
    slugs: ["vision-care-1", "vision-care-2", "vision-care-3"],
  },
];
