import type { ReactNode } from "react";
import type { Story } from "@/data/content";
import StoryCard from "./StoryCard";
import styles from "./RelatedStories.module.css";

type RelatedStoriesProps = {
  stories: Story[];
  /** 接著聽的那一集（由新到舊的下一筆，也就是較舊的一集），顯示為可點的封面卡 */
  nextStory?: Story | null;
  /** 頁尾與「接著聽」同一列的島嶼連結 */
  zone?: ReactNode;
};

const NEXT_HEADING_ID = "story-next-heading";

export default function RelatedStories({
  stories,
  nextStory = null,
  zone = null,
}: RelatedStoriesProps) {
  if (stories.length === 0 && !nextStory && !zone) return null;

  return (
    <section
      className={styles.section}
      // 有「接著聽」標題時用它命名這一區，讀屏不會先後念出兩個不同的名字。
      {...(nextStory ? { "aria-labelledby": NEXT_HEADING_ID } : { "aria-label": "相關故事" })}
    >
      {nextStory || zone ? (
        <div className={styles.nextHead}>
          {nextStory ? (
            <h2 id={NEXT_HEADING_ID} className={styles.nextLabel}>
              接著聽
            </h2>
          ) : null}
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
