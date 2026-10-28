import Image from "next/image";
import {
  formatParentArticleDate,
  PARENT_ARTICLE_AUTHOR,
} from "@/lib/parent-articles";
import Icon from "@/components/ui/Icon";
import styles from "./ParentArticlesMasthead.module.css";

type ParentArticlesMastheadProps = {
  title: string;
  count: number;
  latestPublishedAt: string | null;
  /** 最長一篇的閱讀分鐘；決定署名後那句「每篇約一分鐘讀完」怎麼寫。 */
  longestMinutes: number;
  /** 電子報沿用同一刊頭：單位改「期」，不放方格子連結。 */
  variant?: "articles" | "newsletter";
};

function readingPace(longestMinutes: number, noun: "篇" | "期"): string {
  return longestMinutes <= 1
    ? `每${noun}約一分鐘讀完`
    : `每${noun} ${longestMinutes} 分鐘內讀完`;
}

/** 育兒文章列表頁首：標題、作者署名、篇數與最近更新、方格子入口。 */
export function ParentArticlesMasthead({
  title,
  count,
  latestPublishedAt,
  longestMinutes,
  variant = "articles",
}: ParentArticlesMastheadProps) {
  const noun = variant === "newsletter" ? "期" : "篇";
  const pace = readingPace(longestMinutes, noun);
  const lede =
    variant === "newsletter"
      ? `${PARENT_ARTICLE_AUTHOR.name}寫給爸媽的電子報，${pace}。`
      : `${PARENT_ARTICLE_AUTHOR.name}寫給爸媽的育兒心得，${pace}。`;
  const stats = latestPublishedAt
    ? `${count} ${noun} · 最近更新 ${formatParentArticleDate(latestPublishedAt)}`
    : `${count} ${noun}`;

  return (
    <header className={styles.masthead}>
      <p className={styles.eyebrow}>給爸媽</p>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.byline}>
        <Image
          src={PARENT_ARTICLE_AUTHOR.avatar}
          alt=""
          width={48}
          height={48}
          className={styles.avatar}
        />
        <div className={styles.bylineText}>
          <p className={styles.lede}>{lede}</p>
          <p className={styles.meta}>
            <span>{stats}</span>
            {variant === "articles" ? (
              <>
                <span className={styles.metaSep} aria-hidden="true">
                  ·
                </span>
                <a
                  className={styles.vocus}
                  href={PARENT_ARTICLE_AUTHOR.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="在方格子追蹤（另開視窗）"
                >
                  在方格子追蹤
                  <Icon name="external" size={14} />
                </a>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </header>
  );
}
