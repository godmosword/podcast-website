import Image from "next/image";
import Link from "next/link";
import type { ParentArticle } from "@/data/parent-articles";
import {
  formatParentArticleDate,
  parentArticleMonthLabel,
  parentArticlePath,
  parentArticleReadingMinutes,
} from "@/lib/parent-articles";
import Icon from "@/components/ui/Icon";
import styles from "./ParentArticleList.module.css";

/** 封面故事只放摘要開頭幾行（原文換行，不改寫），讓卡片高度穩定。 */
const FEATURE_EXCERPT_LINES = 3;
const MORE_HEADING_ID = "parent-articles-more";

/** 列表卡只需要這些欄位。育兒文章多出來的 blocks 仍可傳進來。 */
export type ArticleCard = {
  readonly slug: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly excerpt: string;
  readonly coverImage?: string;
  readonly coverAlt?: string;
  /** 有給就用；沒給則依育兒文章的 blocks 估算。 */
  readonly minutes?: number;
};

export type ArticleListLayout = {
  readonly latest: ArticleCard | null;
  readonly series: readonly {
    readonly id: string;
    readonly title: string;
    readonly articles: readonly ArticleCard[];
  }[];
  readonly months: readonly {
    readonly key: string;
    readonly articles: readonly ArticleCard[];
  }[];
};

function excerptLines(excerpt: string): string[] {
  return excerpt
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(0, FEATURE_EXCERPT_LINES);
}

function cardMinutes(article: ArticleCard): number {
  if (typeof article.minutes === "number") return article.minutes;
  return parentArticleReadingMinutes(article as ParentArticle);
}

function FeaturedArticle({
  article,
  hrefFor,
}: {
  article: ArticleCard;
  hrefFor: (slug: string) => string;
}) {
  return (
    <Link className={styles.feature} href={hrefFor(article.slug)}>
      {article.coverImage ? (
        <span className={styles.cover}>
          <Image
            src={article.coverImage}
            alt={article.coverAlt ?? ""}
            fill
            sizes="(max-width: 720px) 100vw, 720px"
          />
        </span>
      ) : null}
      <p className={styles.kicker}>
        <span className={styles.newBadge}>最新</span>
        <span>
          <time dateTime={article.publishedAt}>
            {formatParentArticleDate(article.publishedAt)}
          </time>
          {` · 約 ${cardMinutes(article)} 分鐘`}
        </span>
      </p>
      <h2 className={styles.featureTitle}>{article.title}</h2>
      <p className={styles.verse}>
        {excerptLines(article.excerpt).map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </p>
      <span className={styles.cta}>
        讀這篇
        <Icon name="arrow-right" size={16} />
      </span>
    </Link>
  );
}

function seriesMeta(series: ArticleListLayout["series"][number]): string {
  const first = series.articles[0];
  const dates = new Set(series.articles.map((entry) => entry.publishedAt));
  const when =
    dates.size === 1
      ? formatParentArticleDate(first.publishedAt)
      : `${formatParentArticleDate(first.publishedAt)}起`;
  const parts = [`${series.articles.length} 篇`, when];
  if (series.articles.length > 1) parts.push("建議從第 1 篇讀起");
  return parts.join(" · ");
}

function ArticleSeries({
  series,
  hrefFor,
}: {
  series: ArticleListLayout["series"][number];
  hrefFor: (slug: string) => string;
}) {
  const headingId = `parent-series-${series.id}`;
  return (
    <section className={styles.series} aria-labelledby={headingId}>
      <div className={styles.sectionHead}>
        <p className={styles.label}>系列</p>
        <h2 id={headingId} className={styles.sectionTitle}>
          {series.title}
        </h2>
        <p className={styles.meta}>{seriesMeta(series)}</p>
      </div>
      <ol className={styles.parts}>
        {series.articles.map((article, index) => (
          <li key={article.slug}>
            <Link className={styles.part} href={hrefFor(article.slug)}>
              <span className={styles.partNum} aria-hidden="true">
                {index + 1}
              </span>
              <h3 className={styles.partTitle}>{article.title}</h3>
              <span className={styles.partExcerpt}>{article.excerpt}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MoreArticles({
  months,
  hrefFor,
}: {
  months: ArticleListLayout["months"];
  hrefFor: (slug: string) => string;
}) {
  return (
    <section className={styles.more} aria-labelledby={MORE_HEADING_ID}>
      <h2 id={MORE_HEADING_ID} className={styles.sectionTitle}>
        更多文章
      </h2>
      {months.map((month) => (
        <div key={month.key} className={styles.month}>
          <h3 className={styles.monthTitle}>{parentArticleMonthLabel(month.key)}</h3>
          <ol className={styles.rows}>
            {month.articles.map((article) => (
              <li key={article.slug}>
                <Link
                  className={styles.row}
                  href={hrefFor(article.slug)}
                  aria-label={`${article.title}，${formatParentArticleDate(article.publishedAt)}`}
                >
                  <time className={styles.day} dateTime={article.publishedAt}>
                    {Number(article.publishedAt.slice(8, 10))}
                  </time>
                  <span className={styles.rowBody}>
                    <span className={styles.rowTitle}>{article.title}</span>
                    <span className={styles.rowExcerpt}>
                      {article.excerpt.replace(/\s*\n\s*/g, " ")}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={18} className={styles.rowArrow} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

/** 育兒文章列表：最新一篇當封面故事、系列照閱讀順序、其他文章依月份。電子報沿用同一套。 */
export function ParentArticleList({
  layout,
  hrefFor = parentArticlePath,
}: {
  layout: ArticleListLayout;
  hrefFor?: (slug: string) => string;
}) {
  const { latest, series, months } = layout;
  if (!latest && series.length === 0 && months.length === 0) return null;

  return (
    <div className={styles.stack}>
      {latest ? <FeaturedArticle article={latest} hrefFor={hrefFor} /> : null}
      {series.map((entry) => (
        <ArticleSeries key={entry.id} series={entry} hrefFor={hrefFor} />
      ))}
      {months.length > 0 ? <MoreArticles months={months} hrefFor={hrefFor} /> : null}
    </div>
  );
}
