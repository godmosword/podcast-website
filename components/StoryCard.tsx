import Link from "next/link";
import type { Story } from "@/data/content";
import { formatDate, storyCoverPath } from "@/lib/story-utils";
import StoryImage from "./StoryImage";
import { TagChip } from "./Chip";
import StoryAge from "./StoryAge";
import RoughFrame from "./decor/RoughFrame";
import styles from "./StoryCard.module.css";

type StoryCardProps = {
  story: Story;
  /** 列表索引，用於進場依序彈入 */
  index?: number;
  /** list：橫式列表（預設）；grid：故事牆直式卡片 */
  variant?: "list" | "grid";
  /** 隱藏日期 / 時長 / 年齡（僅保留 EP）；首頁列表用 */
  hideMeta?: boolean;
};

export default function StoryCard({
  story,
  index = 0,
  variant = "list",
  hideMeta = false,
}: StoryCardProps) {
  const isGrid = variant === "grid";

  return (
    <Link
      href={`/story/${story.slug}`}
      className={`${styles.card} ${isGrid ? styles.cardGrid : ""} popIn press-squash`}
      style={{
        boxShadow: `var(--shadow-md), 0 6px 0 ${story.color}`,
        animationDelay: `${Math.min(index, 8) * 55}ms`,
      }}
    >
      <RoughFrame color={story.color} rough={index % 2 === 0 ? 1 : 2} width={3} />
      <div
        className={`${styles.thumbWrap} ${isGrid ? styles.thumbWrapGrid : ""}`}
        style={{ backgroundColor: `${story.color}22` }}
      >
        <StoryImage
          src={storyCoverPath(story.slug)}
          alt=""
          fill
          className={styles.thumb}
        />
      </div>

      <span className={`${styles.body} ${isGrid ? styles.bodyGrid : ""}`}>
        <span className={styles.meta}>
          <span
            className={`${styles.ep} marker`}
            style={{ ["--marker-color" as string]: story.color }}
          >
            EP {story.ep}
          </span>
          {!hideMeta && (
            <>
              <span>{formatDate(story.date)}</span>
              {story.duration && <span>{story.duration}</span>}
              <StoryAge ageRange={story.ageRange} />
            </>
          )}
        </span>

        <span className={styles.title}>{story.title}</span>

        {story.summary && <span className={styles.summary}>{story.summary}</span>}

        <span className={`${styles.footer} ${isGrid ? styles.footerGrid : ""}`}>
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
