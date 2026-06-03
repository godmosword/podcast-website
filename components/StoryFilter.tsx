import Link from "next/link";
import type { Story } from "@/data/stories";
import StoryCard from "./StoryCard";
import StoryFilterChips from "./StoryFilterChips";
import styles from "./StoryFilter.module.css";

type StoryFilterProps = {
  /** 已依 URL 篩選後的故事（Server 端計算） */
  stories: Story[];
  vehicles: string[];
  tags: string[];
  activeVehicle: string | null;
  activeTag: string | null;
};

export default function StoryFilter({
  stories,
  vehicles,
  tags,
  activeVehicle,
  activeTag,
}: StoryFilterProps) {
  return (
    <section id="stories" aria-labelledby="stories-heading">
      <div className={styles.filterBlock}>
        <h2 id="stories-heading" className={styles.filterHeading}>
          探索故事
        </h2>
        <StoryFilterChips
          vehicles={vehicles}
          tags={tags}
          activeVehicle={activeVehicle}
          activeTag={activeTag}
        />
      </div>

      <p className={styles.count}>
        {stories.length} 則故事
        {(activeVehicle || activeTag) && (
          <Link href="/" className={styles.clear} scroll={false}>
            清除篩選
          </Link>
        )}
      </p>

      {stories.length > 0 ? (
        <ul className={styles.list}>
          {stories.map((story, i) => (
            <li key={story.slug}>
              <StoryCard story={story} index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>
          沒有符合的故事，試試其他車車或關鍵字吧 🚗
        </p>
      )}
    </section>
  );
}
