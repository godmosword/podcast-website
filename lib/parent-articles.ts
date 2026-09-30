import {
  PARENT_ARTICLES,
  type ParentArticle,
} from "@/data/parent-articles";

const ARTICLES_HREF = "/for-parents/articles";

/** 閱讀順序與 `PARENT_ARTICLES` 陣列相同。 */
export function listParentArticles(): readonly ParentArticle[] {
  return PARENT_ARTICLES;
}

export function getParentArticle(slug: string): ParentArticle | undefined {
  return PARENT_ARTICLES.find((article) => article.slug === slug);
}

export function parentArticlePath(slug: string): string {
  return `${ARTICLES_HREF}/${slug}`;
}

export function parentArticlesIndexPath(): string {
  return ARTICLES_HREF;
}

export function parentArticleNeighbors(slug: string): {
  previous: ParentArticle | null;
  next: ParentArticle | null;
} {
  const index = PARENT_ARTICLES.findIndex((article) => article.slug === slug);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: PARENT_ARTICLES[index - 1] ?? null,
    next: PARENT_ARTICLES[index + 1] ?? null,
  };
}

/** `2026-09-12` → `2026年9月12日`。無法解析時原樣返回。 */
export function formatParentArticleDate(publishedAt: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(publishedAt);
  if (!match) return publishedAt;
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}
