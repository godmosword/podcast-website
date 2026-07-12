"use client";

import { useEffect, useMemo, useState } from "react";
import type { ZoneId } from "@/data/universe-zones";
import type { ZoneStoriesBundle } from "@/lib/story-zone-query";
import { getProgressSync, subscribeProgress } from "@/lib/progress-store";

export type ZoneProgress = {
  /** 已聽完集數（engagement.storiesCompleted ∩ 該島 slugs）。 */
  completed: number;
  /** 該島總集數。 */
  total: number;
};

export type ZoneProgressMap = Partial<Record<ZoneId, ZoneProgress>>;

/** 純函式：由完成清單與各島 slugs 算島嶼進度（供 hook 與測試共用）。 */
export function computeZoneProgress(
  zoneStoriesMap: Partial<Record<ZoneId, Pick<ZoneStoriesBundle, "slugs">>>,
  storiesCompleted: Iterable<string>,
): ZoneProgressMap {
  const completedSet =
    storiesCompleted instanceof Set
      ? (storiesCompleted as ReadonlySet<string>)
      : new Set(storiesCompleted);
  const result: ZoneProgressMap = {};
  for (const [zoneId, bundle] of Object.entries(zoneStoriesMap)) {
    if (!bundle) continue;
    result[zoneId as ZoneId] = {
      completed: bundle.slugs.filter((slug) => completedSet.has(slug)).length,
      total: bundle.slugs.length,
    };
  }
  return result;
}

/**
 * 已聽完集數 slug 集合（sheet 打勾等 slug 級顯示用）。
 * - SSG/hydration 安全：首次 render 一律空集合，mount 後才讀 localStorage。
 * - 訂閱 progress-store 變更（同分頁事件＋跨分頁 storage），聽完即時反映。
 * - 「聽完」口徑由 progress-store 的 recordStoryCompleted 單點定義；
 *   STEM-P1 完播口徑定案後只動寫入端，本 hook 與地圖不用改。
 */
export function useCompletedSlugs(): ReadonlySet<string> {
  const [completed, setCompleted] = useState<readonly string[]>([]);

  useEffect(() => {
    const read = () =>
      setCompleted(getProgressSync().engagement.storiesCompleted);
    read();
    return subscribeProgress(read);
  }, []);

  return useMemo(() => new Set(completed), [completed]);
}
