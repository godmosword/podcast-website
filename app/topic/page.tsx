import type { Metadata } from "next";
import Link from "next/link";
import { allTags, getStoriesByTag } from "@/data/content";
import { storyCoverPath } from "@/lib/story-utils";
import { topicVisualFor } from "@/lib/topic-visuals";
import { topicIndexDefinitionSummary } from "@/lib/topic-index-geo";
import StoryImage from "@/components/StoryImage";
import TopicIcon from "@/components/TopicIcon";
import SiteFooter from "@/components/SiteFooter";
import styles from "./page.module.css";

export function generateMetadata(): Metadata {
  const themes = allTags().map((tag) => ({
    tag,
    count: getStoriesByTag(tag).length,
  }));
  const description = topicIndexDefinitionSummary(themes);
  return {
    title: "主題分類",
    description,
    alternates: { canonical: "/topic" },
    openGraph: {
      title: "主題分類 · 車車遊樂園",
      description,
      url: "/topic",
      type: "website",
    },
  };
}

export default function TopicIndexPage() {
  const themes = allTags().map((tag) => {
    const stories = getStoriesByTag(tag);
    return { tag, count: stories.length, coverSlug: stories[0]?.slug ?? null };
  });
  const lede = topicIndexDefinitionSummary(
    themes.map(({ tag, count }) => ({ tag, count })),
  );

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>主題分類</h1>
      <p className={styles.lede}>{lede}</p>
      <p className={styles.subtitle}>
        每集故事都有成長主題，點選主題瀏覽相關集數
      </p>

      <ul className={styles.grid}>
        {themes.map(({ tag, count, coverSlug }) => {
          const visual = topicVisualFor(tag);
          return (
            <li key={tag}>
              <Link
                href={`/topic/${encodeURIComponent(tag)}`}
                className={styles.card}
                aria-label={`${tag}，${count} 集`}
              >
                <span
                  className={styles.thumb}
                  style={{ backgroundColor: visual.bg }}
                >
                  {coverSlug ? (
                    <StoryImage
                      src={storyCoverPath(coverSlug)}
                      alt=""
                      fill
                      className={styles.cover}
                      sizes="(max-width: 640px) 45vw, 220px"
                    />
                  ) : null}
                  <span className={styles.badge}>
                    <TopicIcon tag={tag} size={34} />
                  </span>
                </span>
                <span className={styles.body}>
                  <span className={styles.name}>{tag}</span>
                  <span className={styles.count}>{count} 集</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <SiteFooter />
    </main>
  );
}
