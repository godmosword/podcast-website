import Link from "next/link";
import type { Story } from "@/data/stories";
import { formatDate, storyCoverPath } from "@/lib/story-utils";
import StoryImage from "./StoryImage";
import { TagChip } from "./Chip";
import styles from "./StoryCard.module.css";

type StoryCardProps = {
  story: Story;
  /** 列表索引，用於進場依序彈入 */
  index?: number;
  /** row：橫式列表；grid：直式網格卡（首頁故事牆） */
  variant?: "row" | "grid";
};

export default function StoryCard({
  story,
  index = 0,
  variant = "row",
}: StoryCardProps) {
  const isGrid = variant === "grid";

  return (
    <Link
      href={`/story/${story.slug}`}
      className={`${styles.card} ${isGrid ? styles.cardGrid : ""} popIn`}
      style={{
        borderColor: story.color,
        boxShadow: `var(--shadow-md), 0 6px 0 ${story.color}`,
        animationDelay: `${Math.min(index, 8) * 55}ms`,
      }}
    >
      <div
        className={styles.thumbWrap}
        style={{ backgroundColor: `${story.color}22` }}
      >
        <StoryImage
          src={storyCoverPath(story.slug)}
          alt=""
          fill
          className={styles.thumb}
        />
        <span
          className={styles.emojiBadge}
          style={{ backgroundColor: story.color }}
          aria-hidden
        >
          {story.emoji}
        </span>
      </div>

      <span className={styles.body}>
        <span className={styles.meta}>
          <span
            className={styles.ep}
            style={{ backgroundColor: `${story.color}1f`, color: story.color }}
          >
            EP {story.ep}
          </span>
          <span>{formatDate(story.date)}</span>
          {story.duration && <span>{story.duration}</span>}
        </span>

        <span className={styles.title}>{story.title}</span>

        {story.summary && <span className={styles.summary}>{story.summary}</span>}

        <span className={styles.footer}>
          {story.tags && story.tags.length > 0 && (
            <span className={styles.tags}>
              {story.tags.map((t) => (
                <TagChip key={t} color={story.color}>
                  {t}
                </TagChip>
              ))}
            </span>
          )}
          <span
            className={styles.arrow}
            style={{ backgroundColor: `${story.color}1f`, color: story.color }}
            aria-hidden
          >
            ▶
          </span>
        </span>
      </span>
    </Link>
  );
}
