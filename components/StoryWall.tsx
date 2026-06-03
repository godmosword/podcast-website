import type { Story } from "@/data/stories";
import StoryCard from "./StoryCard";
import styles from "./StoryWall.module.css";

type StoryWallProps = {
  stories: Story[];
};

/**
 * 故事卡片網格（Server Component）：首頁故事牆、篩選結果等共用。
 */
export default function StoryWall({ stories }: StoryWallProps) {
  if (stories.length === 0) {
    return (
      <p className={styles.empty}>沒有符合的故事，試試其他車車或關鍵字吧 🚗</p>
    );
  }

  return (
    <ul className={styles.grid}>
      {stories.map((story, i) => (
        <li key={story.slug} className={styles.item}>
          <StoryCard story={story} index={i} variant="grid" />
        </li>
      ))}
    </ul>
  );
}
