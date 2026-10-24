"use client";

import { useCallback, useEffect, useState } from "react";
import { readActivityLog, subscribeActivity } from "@/lib/activity-log";
import {
  DEFAULT_PROGRESS,
  getProgressSync,
  subscribeProgress,
} from "@/lib/progress-store";
import {
  buildParentDashboardSnapshot,
  pendingWeeklySummary,
  type ParentDashboardSnapshot,
} from "@/lib/for-parents/dashboard";

/** 訂閱 localStorage 進度，供家長儀表板 client 元件使用。 */
export function useParentDashboard(): ParentDashboardSnapshot {
  // 初始值會被預產進 HTML：本週摘要先放沒有日期的空軸，水合才對得上（見 pendingWeeklySummary）。
  const [snapshot, setSnapshot] = useState<ParentDashboardSnapshot>(() => ({
    ...buildParentDashboardSnapshot(DEFAULT_PROGRESS),
    weekly: pendingWeeklySummary(),
  }));

  const refresh = useCallback(() => {
    setSnapshot(buildParentDashboardSnapshot(getProgressSync(), readActivityLog()));
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribeProgress = subscribeProgress(refresh);
    const unsubscribeActivity = subscribeActivity(refresh);
    return () => {
      unsubscribeProgress();
      unsubscribeActivity();
    };
  }, [refresh]);

  return snapshot;
}
