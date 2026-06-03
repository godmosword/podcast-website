import Link from "next/link";
import type { Story } from "@/data/stories";
import StoryFilterChips from "./StoryFilterChips";
import StoryWall from "./StoryWall";
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
          所有故事
        </h2>
        <p className={styles.lead}>點選卡片進入故事，依發布日期由新到舊排列。</p>
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

      <StoryWall stories={stories} />
    </section>
  );
}
