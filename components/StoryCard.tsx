import Link from "next/link";
import type { Story } from "@/data/stories";
import styles from "./StoryCard.module.css";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 把 "2026-06-01" 顯示成 "2026.06.01" */
function formatDate(iso: string): string {
  return iso.replaceAll("-", ".");
}

type StoryCardProps = {
  story: Story;
};

export default function StoryCard({ story }: StoryCardProps) {
  return (
    <Link
      href={`/story/${story.slug}`}
      className={styles.card}
      style={{ borderColor: story.color, boxShadow: `0 6px 0 ${story.color}` }}
    >
      {/* 縮圖：用第一張圖 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/stories/${story.slug}/${pad2(1)}.jpg`}
        alt=""
        className={styles.thumb}
        style={{ backgroundColor: `${story.color}22` }}
        loading="lazy"
      />

      <span className={styles.body}>
        <span className={styles.meta}>
          <span className={styles.ep} style={{ color: story.color }}>
            EP {story.ep}
          </span>
          <span>{formatDate(story.date)}</span>
          {story.duration && <span>{story.duration}</span>}
        </span>

        <span className={styles.title}>
          <span aria-hidden>{story.emoji}</span> {story.title}
        </span>

        {story.summary && <span className={styles.summary}>{story.summary}</span>}

        <span className={styles.footer}>
          {story.tags && story.tags.length > 0 && (
            <span className={styles.tags}>
              {story.tags.map((tag) => (
                <span
                  key={tag}
                  className={styles.tag}
                  style={{
                    color: story.color,
                    backgroundColor: `${story.color}1f`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </span>
          )}
          <span className={styles.arrow} style={{ color: story.color }} aria-hidden>
            ▶
          </span>
        </span>
      </span>
    </Link>
  );
}
