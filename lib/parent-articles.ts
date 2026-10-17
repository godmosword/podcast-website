import {
  PARENT_ARTICLE_SERIES,
  type ParentArticleSeries,
} from "@/data/parent-article-series";
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

/** 列表頁署名。方格子作者頁與 `scripts/lib/vocus-articles.ts` 的 creatorId 同一位。 */
export const PARENT_ARTICLE_AUTHOR = {
  name: "馬米",
  avatar: "/characters/馬米.jpg",
  profileUrl: "https://vocus.cc/user/6aa4a7adaa92714642f625a3",
} as const;

/** 中文一般閱讀速度（字／分鐘），用來估「約幾分鐘」。 */
const READING_CHARS_PER_MINUTE = 350;

function visibleCharCount(text: string): number {
  return [...text.replace(/\s/g, "")].length;
}

/** 依內文字數估閱讀分鐘，最少 1 分鐘。 */
export function parentArticleReadingMinutes(article: ParentArticle): number {
  const chars = article.blocks.reduce((total, block) => {
    switch (block.type) {
      case "paragraph":
      case "heading":
        return total + visibleCharCount(block.text);
      case "list":
        return (
          total +
          block.items.reduce((sum, item) => sum + visibleCharCount(item), 0)
        );
      default:
        return total;
    }
  }, 0);
  return Math.max(1, Math.round(chars / READING_CHARS_PER_MINUTE));
}

export type ParentArticleSeriesGroup = {
  readonly id: string;
  readonly title: string;
  readonly articles: readonly ParentArticle[];
};

export type ParentArticleMonth = {
  /** `YYYY-MM` */
  readonly key: string;
  readonly articles: readonly ParentArticle[];
};

export type ParentArticlesLayout = {
  readonly latest: ParentArticle | null;
  readonly series: readonly ParentArticleSeriesGroup[];
  /** 不是最新、也不在系列裡的文章，依月份新到舊。 */
  readonly months: readonly ParentArticleMonth[];
};

/** 發布日較晚者在後；同一天時陣列裡較後面的較新（同步腳本依發布先後附加）。 */
function byPublishedThenIndex(
  articles: readonly ParentArticle[],
): ParentArticle[] {
  return articles
    .map((entry, index) => ({ entry, index }))
    .sort(
      (a, b) =>
        a.entry.publishedAt.localeCompare(b.entry.publishedAt) ||
        a.index - b.index,
    )
    .map(({ entry }) => entry);
}

function groupByMonth(articles: readonly ParentArticle[]): ParentArticleMonth[] {
  const months: { key: string; articles: ParentArticle[] }[] = [];
  for (const entry of articles) {
    const key = entry.publishedAt.slice(0, 7);
    const last = months[months.length - 1];
    if (last?.key === key) {
      last.articles.push(entry);
    } else {
      months.push({ key, articles: [entry] });
    }
  }
  return months;
}

/**
 * 列表頁的三區：最新一篇、系列（照閱讀順序、整組保留）、其他文章（依月份）。
 * 系列保持完整，所以最新一篇若剛好屬於某系列，會同時出現在兩區。
 */
export function parentArticlesLayout(
  articles: readonly ParentArticle[] = PARENT_ARTICLES,
  seriesList: readonly ParentArticleSeries[] = PARENT_ARTICLE_SERIES,
): ParentArticlesLayout {
  const chronological = byPublishedThenIndex(articles);
  const latest = chronological[chronological.length - 1] ?? null;
  const bySlug = new Map(articles.map((entry) => [entry.slug, entry]));

  const series = seriesList
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      articles: entry.slugs.flatMap((slug) => {
        const found = bySlug.get(slug);
        return found ? [found] : [];
      }),
    }))
    .filter((entry) => entry.articles.length > 0);

  const placed = new Set<string>(
    series.flatMap((entry) => entry.articles.map((a) => a.slug)),
  );
  if (latest) placed.add(latest.slug);
  const others = chronological.filter((entry) => !placed.has(entry.slug)).reverse();

  return { latest, series, months: groupByMonth(others) };
}

/** `2026-09` → `2026 年 9 月`。 */
export function parentArticleMonthLabel(key: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return key;
  return `${match[1]} 年 ${Number(match[2])} 月`;
}
