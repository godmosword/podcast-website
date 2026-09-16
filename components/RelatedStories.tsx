import Link from "next/link";
import type { Story } from "@/data/content";
import StoryCard from "./StoryCard";
import { storyDisplayTitle } from "@/lib/story-title";
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
          {/* 單集色只當底線裝飾：拿它當文字色時，夜間 story.color（如 #7048e8）
              壓 --card 只有 2.2:1（axe serious）。文字走 --accent-ink（雙主題 AA），
              分工同 DESIGN.md：accent → 裝飾／邊框，accent-ink → 文字。 */}
          <Link
            href={`/story/${nextStory.slug}`}
            className={styles.nextLink}
            style={accent ? { textDecorationColor: accent } : undefined}
          >
            EP {nextStory.ep} {storyDisplayTitle(nextStory)}
          </Link>
        </p>
      ) : null}

      {stories.length > 0 ? (
        <>
          <h2 className={styles.heading}>相關故事</h2>
          <ul className={styles.list}>
            {stories.map((story, i) => (
              <li key={story.slug}>
                {/* 美術審 M6：與 /stories 目錄卡同一種密度——只留 EP chip，
                    日期／時長／年齡不在相關故事卡上重複（單集頁 header 已有）。 */}
                <StoryCard story={story} index={i} hideMeta />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
