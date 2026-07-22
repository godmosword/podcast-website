import Link from "next/link";
import type { Story } from "@/data/content";
import StoryCard from "./StoryCard";
import styles from "./RelatedStories.module.css";

type RelatedStoriesProps = {
  stories: Story[];
  /** 下一集（聽完接著聽），顯示於相關故事上方 */
  nextStory?: Story | null;
  accent?: string;
};

export default function RelatedStories({
  stories,
  nextStory = null,
  accent,
}: RelatedStoriesProps) {
  if (stories.length === 0 && !nextStory) return null;

  return (
    <section className={styles.section}>
      {nextStory ? (
        <p className={styles.nextHint}>
          聽完這集可以接著聽{" "}
          <Link
            href={`/story/${nextStory.slug}`}
            className={styles.nextLink}
            style={accent ? { color: accent } : undefined}
          >
            EP {nextStory.ep} {nextStory.title}
          </Link>
        </p>
      ) : null}

      {stories.length > 0 ? (
        <>
          <h2 className={styles.heading}>相關故事</h2>
          <ul className={styles.list}>
            {stories.map((story, i) => (
              <li key={story.slug}>
                <StoryCard story={story} index={i} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
