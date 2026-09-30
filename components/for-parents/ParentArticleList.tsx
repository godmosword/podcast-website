import Image from "next/image";
import Link from "next/link";
import type { ParentArticle } from "@/data/parent-articles";
import {
  formatParentArticleDate,
  parentArticlePath,
} from "@/lib/parent-articles";
import styles from "./ParentArticleList.module.css";

export function ParentArticleList({
  articles,
}: {
  articles: readonly ParentArticle[];
}) {
  return (
    <ol className={styles.list}>
      {articles.map((article) => (
        <li key={article.slug}>
          <Link className={styles.card} href={parentArticlePath(article.slug)}>
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
            <h2 className={styles.title}>{article.title}</h2>
            <time className={styles.date} dateTime={article.publishedAt}>
              {formatParentArticleDate(article.publishedAt)}
            </time>
            <p className={styles.excerpt}>{article.excerpt}</p>
          </Link>
        </li>
      ))}
    </ol>
  );
}
