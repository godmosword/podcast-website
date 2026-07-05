"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_PROGRESS,
  getProgressSync,
  subscribeProgress,
} from "@/lib/progress-store";
import {
  buildParentDashboardSnapshot,
  type ParentDashboardSnapshot,
} from "@/lib/for-parents/dashboard";

/** 訂閱 localStorage 進度，供家長儀表板 client 元件使用。 */
export function useParentDashboard(): ParentDashboardSnapshot {
  const [snapshot, setSnapshot] = useState<ParentDashboardSnapshot>(() =>
    buildParentDashboardSnapshot(DEFAULT_PROGRESS),
  );

  const refresh = useCallback(() => {
    setSnapshot(buildParentDashboardSnapshot(getProgressSync()));
  }, []);

  useEffect(() => {
    refresh();
    return subscribeProgress(refresh);
  }, [refresh]);

  return snapshot;
}
