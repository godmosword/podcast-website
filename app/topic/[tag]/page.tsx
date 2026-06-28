import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allTags, getStoriesByTag } from "@/data/content";
import SiteFooter from "@/components/SiteFooter";
import StoryCard from "@/components/StoryCard";
import styles from "./page.module.css";

export function generateStaticParams() {
  return allTags().map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag: encoded } = await params;
  const tag = decodeURIComponent(encoded);
  return {
    title: `${tag}主題故事`,
    description: `車車遊樂園所有「${tag}」主題的親子故事，適合家長依成長主題挑選收聽。`,
    alternates: { canonical: `/topic/${encodeURIComponent(tag)}` },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: encoded } = await params;
  const tag = decodeURIComponent(encoded);
  const stories = getStoriesByTag(tag);

  if (stories.length === 0) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>{tag}主題故事</h1>
      <p className={styles.subtitle}>{stories.length} 則故事等你來聽</p>

      <ul className={styles.list}>
        {stories.map((story, i) => (
          <li key={story.slug}>
            <StoryCard story={story} index={i} />
          </li>
        ))}
      </ul>

      <p className={styles.more}>
        <Link href="/topic">瀏覽其他主題 →</Link>
      </p>

      <SiteFooter />
    </main>
  );
}
