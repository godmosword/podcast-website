import type { Metadata } from "next";
import Link from "next/link";
import { allTags } from "@/data/content";
import SiteFooter from "@/components/SiteFooter";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "主題標籤",
  description:
    "依勇氣、守信用、安全合作、情緒等主題，挑選車車遊樂園親子故事。",
  alternates: { canonical: "/topic" },
};

export default function TopicIndexPage() {
  const tags = allTags();

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>主題標籤</h1>
      <p className={styles.subtitle}>
        每集故事都有成長主題，點選標籤瀏覽相關集數
      </p>

      <ul className={styles.tagList}>
        {tags.map((tag) => (
          <li key={tag}>
            <Link
              href={`/topic/${encodeURIComponent(tag)}`}
              className={styles.tagLink}
            >
              {tag}
            </Link>
          </li>
        ))}
      </ul>

      <SiteFooter />
    </main>
  );
}
