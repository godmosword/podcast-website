import Image from "next/image";
import Link from "next/link";
import type { ParentArticle, ParentArticleBlock } from "@/data/parent-articles";
import {
  formatParentArticleDate,
  parentArticlePath,
  parentArticlesIndexPath,
} from "@/lib/parent-articles";
import styles from "./ParentArticleView.module.css";
import Icon from "@/components/ui/Icon";

function ArticleBlock({
  block,
  index,
}: {
  block: ParentArticleBlock;
  index: number;
}) {
  switch (block.type) {
    case "spacer":
      return <div className={styles.spacer} aria-hidden="true" />;
    case "paragraph":
      return <p>{block.text}</p>;
    case "heading":
      return block.level === 2 ? <h2>{block.text}</h2> : <h3>{block.text}</h3>;
    case "list":
      return (
        <ul>
          {block.items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      );
    case "image":
      return (
        <figure className={styles.figure}>
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
          />
        </figure>
      );
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
}

export function ParentArticleView({
  article,
  previous,
  next,
}: {
  article: ParentArticle;
  previous: ParentArticle | null;
  next: ParentArticle | null;
}) {
  return (
    <article className={styles.article}>
      <Link className={styles.back} href={parentArticlesIndexPath()}>
        <Icon name="arrow-left" size={16} className="icon-lead" />回到育兒文章分享
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title}>{article.title}</h1>
        <time className={styles.date} dateTime={article.publishedAt}>
          {formatParentArticleDate(article.publishedAt)}
        </time>
      </header>
      {article.coverImage ? (
        <figure className={styles.hero}>
          <Image
            src={article.coverImage}
            alt={article.coverAlt ?? ""}
            fill
            priority
            sizes="(max-width: 720px) 100vw, 640px"
          />
        </figure>
      ) : null}
      <div className={styles.body}>
        {article.blocks.map((block, index) => (
          <ArticleBlock key={index} block={block} index={index} />
        ))}
      </div>
      <p className={styles.source}>
        原文刊於
        <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
          方格子〈{article.title}〉
        </a>
      </p>
      <nav className={styles.seriesNav} aria-label="系列文章">
        {previous ? (
          <Link className={styles.seriesLink} href={parentArticlePath(previous.slug)}>
            <span className={styles.seriesLabel}>上一篇</span>
            <span className={styles.seriesTitle}>{previous.title}</span>
          </Link>
        ) : null}
        {next ? (
          <Link
            className={`${styles.seriesLink} ${styles.seriesNext}`}
            href={parentArticlePath(next.slug)}
          >
            <span className={styles.seriesLabel}>下一篇</span>
            <span className={styles.seriesTitle}>{next.title}</span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
