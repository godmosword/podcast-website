import Link from "next/link";
import { DEMO_B3_BLOCKS, DEMO_SOURCE_ARTICLE } from "@/lib/demo-article-layout";
import { formatParentArticleDate } from "@/lib/parent-articles";
import styles from "./DemoArticleB3.module.css";

const LINKS = [
  { href: "/demo/style-b2", label: "跟 B2 並排看" },
  { href: "/demo/style-b", label: "看 B 版" },
] as const;

export function DemoArticleB3() {
  return (
    <article className={styles.page}>
      <p className={styles.banner}>
        排版示範，不是正式文章。文字是原文接起來，沒有改寫。
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </p>
      <header className={styles.header}>
        <p className={styles.kicker}>閱讀版</p>
        <h1 className={styles.title}>{DEMO_SOURCE_ARTICLE.title}</h1>
        <p className={styles.meta}>
          <time dateTime={DEMO_SOURCE_ARTICLE.publishedAt}>
            {formatParentArticleDate(DEMO_SOURCE_ARTICLE.publishedAt)}
          </time>
        </p>
      </header>
      {DEMO_B3_BLOCKS.map((block, index) => {
        if (block.kind === "subhead") {
          return (
            <h2 key={index} className={styles.subhead}>
              {block.text}
            </h2>
          );
        }
        return (
          <p key={index} className={styles.stanza}>
            {block.texts.map((text, textIndex) => (
              <span key={`${index}-${textIndex}`}>{text}</span>
            ))}
          </p>
        );
      })}
      <footer className={styles.footer}>
        <p>
          原文刊於
          <a href={DEMO_SOURCE_ARTICLE.sourceUrl} target="_blank" rel="noopener noreferrer">
            方格子〈{DEMO_SOURCE_ARTICLE.title}〉
          </a>
        </p>
        <p>
          <Link href={`/for-parents/articles/${DEMO_SOURCE_ARTICLE.slug}`}>正式文章頁</Link>
        </p>
      </footer>
    </article>
  );
}
