import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allTags, getStoriesByTag } from "@/data/content";
import { faqPageJsonLd } from "@/lib/json-ld";
import { topicDefinitionSummary, topicFaqs } from "@/lib/topic-geo";
import JsonLd from "@/components/JsonLd";
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
  const stories = getStoriesByTag(tag);
  if (stories.length === 0) {
    return { title: "找不到主題" };
  }

  const description = topicDefinitionSummary(tag, stories);
  return {
    title: `${tag}主題故事`,
    description,
    alternates: { canonical: `/topic/${encodeURIComponent(tag)}` },
    openGraph: {
      title: `${tag}主題故事 · 車車遊樂園`,
      description,
      url: `/topic/${encodeURIComponent(tag)}`,
      type: "website",
    },
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

  const lede = topicDefinitionSummary(tag, stories);
  const faqs = topicFaqs(tag, stories);

  return (
    <main className={styles.main}>
      <JsonLd data={faqPageJsonLd(faqs)} />
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>{tag}主題故事</h1>
      <p className={styles.lede}>{lede}</p>
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
        {" · "}
        <Link href="/for-parents">家長指南</Link>
      </p>

      <SiteFooter />
    </main>
  );
}
