"use client";

import { useCompletedStories } from "@/hooks/useCompletedStories";
import styles from "./StoryProgressBadge.module.css";

type StoryProgressBadgeProps = {
  slug: string;
};

/**
 * 「已聽完」星章，貼在故事封面右上角。
 *
 * 語彙與宇宙地圖一致（`ZoneSheet` 的 `⭐` + `aria-label="已聽完"`、島嶼星章），
 * 讓「卡片得星 → 島嶼星章成長」是同一件事，兒童只需學一次符號。
 *
 * 只表達「聽完」單一狀態：progress store 的 `continue` 是全站單一欄位（只記最近
 * 一集），做成「聽到一半」會導致標記至多出現一張、且因為改聽別集而無預警消失，
 * 對幼兒是反向學習訊號。「繼續聽」動線另由 `lib/continue-playback` 既有入口負責。
 */
export default function StoryProgressBadge({ slug }: StoryProgressBadgeProps) {
  const completed = useCompletedStories();

  if (!completed.has(slug)) return null;

  return (
    <span className={styles.badge} role="img" aria-label="已聽完">
      ⭐
    </span>
  );
}
