import { NEWSLETTERS, type Newsletter } from "@/data/newsletters";
import { newsletterVisibleText } from "@/lib/newsletter-markdown";

const INDEX_HREF = "/newsletter";

/** 與育兒文章同一套中文閱讀速度（字／分鐘）。 */
const READING_CHARS_PER_MINUTE = 350;

function visibleCharCount(text: string): number {
  return [...text.replace(/\s/g, "")].length;
}

/** 閱讀順序與 `NEWSLETTERS` 陣列相同。 */
export function listNewsletters(): readonly Newsletter[] {
  return NEWSLETTERS;
}

export function getNewsletter(slug: string): Newsletter | undefined {
  return NEWSLETTERS.find((issue) => issue.slug === slug);
}

export function newsletterPath(slug: string): string {
  return `${INDEX_HREF}/${slug}`;
}

export function newslettersIndexPath(): string {
  return INDEX_HREF;
}

export function newsletterNeighbors(slug: string): {
  previous: Newsletter | null;
  next: Newsletter | null;
} {
  const index = NEWSLETTERS.findIndex((issue) => issue.slug === slug);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: NEWSLETTERS[index - 1] ?? null,
    next: NEWSLETTERS[index + 1] ?? null,
  };
}

/** 依內文字數估閱讀分鐘，最少 1 分鐘。 */
export function newsletterReadingMinutes(issue: Newsletter): number {
  const chars = visibleCharCount(newsletterVisibleText(issue.body));
  return Math.max(1, Math.round(chars / READING_CHARS_PER_MINUTE));
}

type NewsletterCard = {
  readonly slug: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly excerpt: string;
  readonly minutes: number;
};

function toCard(issue: Newsletter): NewsletterCard {
  return {
    slug: issue.slug,
    title: issue.title,
    publishedAt: issue.publishedAt,
    excerpt: issue.description,
    minutes: newsletterReadingMinutes(issue),
  };
}

/**
 * 列表與育兒文章同一套：最新一期當封面；其餘依月份新到舊。
 * 電子報目前沒有系列，系列區留空。
 */
export function newslettersLayout(
  issues: readonly Newsletter[] = NEWSLETTERS,
): {
  readonly latest: NewsletterCard | null;
  readonly series: readonly [];
  readonly months: readonly { readonly key: string; readonly articles: readonly NewsletterCard[] }[];
} {
  const chronological = issues
    .map((entry, index) => ({ entry, index }))
    .sort(
      (a, b) =>
        a.entry.publishedAt.localeCompare(b.entry.publishedAt) ||
        a.index - b.index,
    )
    .map(({ entry }) => entry);
  const latest = chronological[chronological.length - 1] ?? null;
  const others = chronological.slice(0, -1).reverse();
  const months: { key: string; articles: NewsletterCard[] }[] = [];
  for (const entry of others) {
    const key = entry.publishedAt.slice(0, 7);
    const card = toCard(entry);
    const last = months[months.length - 1];
    if (last?.key === key) last.articles.push(card);
    else months.push({ key, articles: [card] });
  }
  return {
    latest: latest ? toCard(latest) : null,
    series: [],
    months,
  };
}
