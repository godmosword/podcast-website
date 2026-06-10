import type { Story } from "@/data/content";
import { TagChip } from "./Chip";
import styles from "./StoryMeta.module.css";

type StoryMetaProps = {
  story: Story;
  align?: "center" | "left";
  showTags?: boolean;
};

export default function StoryMeta({
  story,
  align = "center",
  showTags = true,
}: StoryMetaProps) {
  return (
    <>
      <div
        className={`${styles.meta} ${align === "left" ? styles.metaLeft : ""}`}
      >
        <span className={styles.ep} style={{ color: story.color }}>
          EP {story.ep}
        </span>
        {story.duration && (
          <span>
            時長 <span className={styles.durationValue}>{story.duration}</span>
          </span>
        )}
      </div>

      {showTags && (
        <div
          className={`${styles.tags} ${align === "left" ? styles.tagsLeft : ""}`}
        >
          <TagChip variant="vehicle" color={story.color}>
            {story.emoji} {story.vehicle}
          </TagChip>
          {story.tags?.map((tag) => (
            <TagChip key={tag}>{tag}</TagChip>
          ))}
        </div>
      )}
    </>
  );
}

export function StoryTags({
  story,
  align = "center",
}: Pick<StoryMetaProps, "story" | "align">) {
  return (
    <div
      className={`${styles.tags} ${align === "left" ? styles.tagsLeft : ""}`}
    >
      <TagChip variant="vehicle" color={story.color}>
        {story.emoji} {story.vehicle}
      </TagChip>
      {story.tags?.map((tag) => (
        <TagChip key={tag}>{tag}</TagChip>
      ))}
    </div>
  );
}
