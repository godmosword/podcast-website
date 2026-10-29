import Image from "next/image";
import Link from "next/link";
import type { ParentArticle } from "@/data/parent-articles";
import { formatParentArticleDate } from "@/lib/parent-articles";
import styles from "./ParentSectionPage.module.css";

/** 親子出國列表。沿用這一區的欄寬與字級，不套育兒文章的封面／系列版面。 */
export function ParentSectionArticleList({
  articles,
  hrefFor,
}: {
  articles: readonly ParentArticle[];
  hrefFor: (slug: string) => string;
}) {
  if (articles.length === 0) return null;
  return (
    <ol className={styles.list}>
      {articles.map((article) => (
        <li key={article.slug}>
          <Link className={styles.card} href={hrefFor(article.slug)}>
            {article.coverImage ? (
              <span className={styles.cardCover}>
                <Image
                  src={article.coverImage}
                  alt={article.coverAlt ?? ""}
                  fill
                  sizes="(max-width: 720px) 100vw, 640px"
                />
              </span>
            ) : null}
            <h2 className={styles.cardTitle}>{article.title}</h2>
            <time className={styles.cardDate} dateTime={article.publishedAt}>
              {formatParentArticleDate(article.publishedAt)}
            </time>
            <p className={styles.cardExcerpt}>{article.excerpt}</p>
          </Link>
        </li>
      ))}
    </ol>
  );
}
