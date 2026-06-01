import Link from "next/link";
import { stories } from "@/data/stories";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleEmoji}>🚗</span>
          車車故事屋
        </h1>
        <p className={styles.subtitle}>看圖、聽故事、左右翻頁</p>
      </header>

      <ul className={styles.list}>
        {stories.map((story) => (
          <li key={story.slug}>
            <Link
              href={`/story/${story.slug}`}
              className={styles.card}
              style={{
                // 用故事主題色做邊框與下方立體陰影
                borderColor: story.color,
                boxShadow: `0 6px 0 ${story.color}`,
              }}
            >
              <span
                className={styles.cardEmoji}
                style={{ backgroundColor: `${story.color}22` }}
                aria-hidden
              >
                {story.emoji}
              </span>

              <span className={styles.cardText}>
                <span className={styles.cardTitle}>{story.title}</span>
                <span className={styles.cardMeta}>
                  {story.pageCount} 張圖 · 含語音
                </span>
              </span>

              <span
                className={styles.cardArrow}
                style={{ color: story.color }}
                aria-hidden
              >
                ▶
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
