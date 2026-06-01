import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStory, getRelated, stories } from "@/data/stories";
import { storyDetailMetadata } from "@/lib/story-metadata";
import { formatDate, storyCoverPath } from "@/lib/story-utils";
import RelatedStories from "@/components/RelatedStories";
import SiteFooter from "@/components/SiteFooter";
import styles from "./page.module.css";

export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) {
    return { title: "找不到故事" };
  }
  return storyDetailMetadata(story);
}

// Next 15 的 params 是 Promise，要 await。
export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getStory(slug);

  if (!story) {
    notFound();
  }

  const related = getRelated(slug, 3);

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <article>
        <div className={styles.hero}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={storyCoverPath(story.slug)}
            alt={`${story.title} 封面`}
            className={styles.cover}
            style={{ borderColor: story.color }}
          />

          <div className={styles.meta}>
            <span className={styles.ep} style={{ color: story.color }}>
              EP {story.ep}
            </span>
            <span>{formatDate(story.date)}</span>
            {story.duration && <span>{story.duration}</span>}
          </div>

          <h1 className={styles.title}>
            <span aria-hidden>{story.emoji}</span> {story.title}
          </h1>

          <div className={styles.tags}>
            <span
              className={styles.vehicle}
              style={{ color: story.color, backgroundColor: `${story.color}1f` }}
            >
              🚗 {story.vehicle}
            </span>
            {story.tags?.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <Link
          href={`/story/${story.slug}/play`}
          className={styles.playCta}
          style={{ backgroundColor: story.color }}
        >
          ▶ 開始看故事
        </Link>

        {story.summary && (
          <section className={styles.summarySection}>
            <h2 className={styles.sectionHeading}>故事大綱</h2>
            <p className={styles.summary}>{story.summary}</p>
          </section>
        )}

        <RelatedStories stories={related} />
      </article>

      <SiteFooter />
    </main>
  );
}
