import Link from "next/link";
import type { Story } from "@/data/stories";
import { formatDate, storyCoverPath } from "@/lib/story-utils";
import StoryImage from "./StoryImage";
import { TagChip } from "./Chip";
import styles from "./StoryCard.module.css";

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
      </div>

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
              {story.tags.map((t) => (
                <TagChip key={t} color={story.color}>
                  {t}
                </TagChip>
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
