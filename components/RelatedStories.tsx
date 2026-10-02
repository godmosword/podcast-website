import type { ReactNode } from "react";
import type { Story } from "@/data/content";
import StoryCard from "./StoryCard";
import styles from "./RelatedStories.module.css";

type RelatedStoriesProps = {
  stories: Story[];
  /** 下一集，顯示為可點的封面卡 */
  nextStory?: Story | null;
  /** 頁尾與「下一集」同一列的島嶼連結 */
  zone?: ReactNode;
};

export default function RelatedStories({
  stories,
  nextStory = null,
  zone = null,
}: RelatedStoriesProps) {
  if (stories.length === 0 && !nextStory && !zone) return null;

  return (
    <section className={styles.section} aria-label="接著看">
      {nextStory || zone ? (
        <div className={styles.nextHead}>
          {nextStory ? <h2 className={styles.nextLabel}>下一集</h2> : null}
          {zone}
        </div>
      ) : null}

      {nextStory ? (
        <div className={styles.nextCard}>
          {/* 整張封面卡可點；accent 只留給卡上既有的 EP／箭頭淡底，不拿來當文字色。 */}
          <StoryCard story={nextStory} hideMeta sharedCoverMorph={false} />
        </div>
      ) : null}

      {stories.length > 0 ? (
        <ul className={styles.list} aria-label="相關故事">
          {stories.map((story, i) => (
            <li key={story.slug}>
              <StoryCard story={story} index={i} hideMeta />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
