"use client";

import { useParentDashboard } from "@/hooks/useParentDashboard";
import { ParentDashboardGames } from "./ParentDashboardGames";
import { ParentDashboardNextUp } from "./ParentDashboardNextUp";
import { ParentDashboardProgress } from "./ParentDashboardProgress";
import { ParentDashboardSettings } from "./ParentDashboardSettings";
import { ParentDashboardWeekly } from "./ParentDashboardWeekly";
import styles from "./parent-dashboard.module.css";

/**
 * STEM-P3 家長儀表板（讀 localStorage，無後端）。
 * 順序：本週摘要 → 接著聽 → 故事進度 → 小遊戲 → 設定；≥980 兩欄（7:5）。
 * 只在這裡訂閱一次進度，再把快照往下傳。
 */
export function ParentDashboard() {
  const snap = useParentDashboard();

  return (
    <div className={styles.parentDashboard}>
      <div className={styles.grid}>
        <div className={styles.areaWeek}>
          <ParentDashboardWeekly weekly={snap.weekly} />
        </div>
        <div className={styles.areaNext}>
          <ParentDashboardNextUp nextUp={snap.nextUp} />
        </div>
        <div className={styles.areaProgress}>
          <ParentDashboardProgress
            listened={snap.listenedStories}
            total={snap.totalStories}
          />
        </div>
        <div className={styles.areaGames}>
          <ParentDashboardGames snap={snap} />
        </div>
        <div className={styles.areaSettings}>
          <ParentDashboardSettings
            kidsMode={snap.kidsMode}
            sfxEnabled={snap.sfxEnabled}
          />
        </div>
      </div>
    </div>
  );
}
