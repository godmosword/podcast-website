import type { Story } from "@/data/stories";
import StoryCard from "./StoryCard";
import styles from "./RelatedStories.module.css";

type RelatedStoriesProps = {
  stories: Story[];
};

export default function RelatedStories({ stories }: RelatedStoriesProps) {
  if (stories.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>相關故事</h2>
      <ul className={styles.list}>
        {stories.map((story, i) => (
          <li key={story.slug}>
            <StoryCard story={story} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
