import { PARENT_ARTICLES, type ParentArticle } from "../data/parent-articles";
import { PARENT_TRAVEL_ABROAD_ARTICLES } from "../data/parent-travel-abroad-articles";

// `next.config.ts` 會載入轉址。設定檔編譯不會套 `@/`，所以這個檔用相對路徑。

const SECTION_HREF = "/for-parents/travel-abroad";

/** 列表導言。沿用這一區原本的說明，拿掉「內容整理中」。 */
export const TRAVEL_ABROAD_LEDE = "親子出國的準備與行程。";

function assertDistinctFromParentArticles(): void {
  const slugs = new Set(PARENT_ARTICLES.map((article) => article.slug));
  const urls = new Set(PARENT_ARTICLES.map((article) => article.sourceUrl));
  for (const article of PARENT_TRAVEL_ABROAD_ARTICLES) {
    if (slugs.has(article.slug) || urls.has(article.sourceUrl)) {
      throw new Error(`親子出國與育兒文章重複：${article.slug}`);
    }
  }
}

assertDistinctFromParentArticles();

/** 閱讀順序與陣列相同（同步由舊到新附加）。 */
export function listTravelAbroadArticles(): readonly ParentArticle[] {
  return PARENT_TRAVEL_ABROAD_ARTICLES;
}

/** 列表頁用：發布日新的在前；同一天較晚同步的在前。 */
export function listTravelAbroadArticlesByRecency(): readonly ParentArticle[] {
  return PARENT_TRAVEL_ABROAD_ARTICLES.map((article, index) => ({ article, index }))
    .sort(
      (left, right) =>
        right.article.publishedAt.localeCompare(left.article.publishedAt) ||
        right.index - left.index,
    )
    .map(({ article }) => article);
}

export function getTravelAbroadArticle(slug: string): ParentArticle | undefined {
  return PARENT_TRAVEL_ABROAD_ARTICLES.find((article) => article.slug === slug);
}

export function travelAbroadIndexPath(): string {
  return SECTION_HREF;
}

export function travelAbroadArticlePath(slug: string): string {
  return `${SECTION_HREF}/${slug}`;
}

export function travelAbroadNeighbors(slug: string): {
  previous: ParentArticle | null;
  next: ParentArticle | null;
} {
  const index = PARENT_TRAVEL_ABROAD_ARTICLES.findIndex((article) => article.slug === slug);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: PARENT_TRAVEL_ABROAD_ARTICLES[index - 1] ?? null,
    next: PARENT_TRAVEL_ABROAD_ARTICLES[index + 1] ?? null,
  };
}

/**
 * 文章只住在一個網址。舊網址永久轉到現在的區，避免搬走之後還能從兩邊讀到，
 * 或是舊連結變成 404。
 */
export function travelAbroadLocationRedirects(): Array<{
  source: string;
  destination: string;
  permanent: boolean;
}> {
  return [
    ...PARENT_TRAVEL_ABROAD_ARTICLES.map((article) => ({
      source: `/for-parents/articles/${article.slug}`,
      destination: travelAbroadArticlePath(article.slug),
      permanent: true,
    })),
    ...PARENT_ARTICLES.map((article) => ({
      source: `${SECTION_HREF}/${article.slug}`,
      destination: `/for-parents/articles/${article.slug}`,
      permanent: true,
    })),
  ];
}
