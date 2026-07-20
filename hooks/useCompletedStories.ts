"use client";

import { useSyncExternalStore } from "react";
import { getProgressSync, subscribeProgress } from "@/lib/progress-store";

/**
 * 已聽完的故事 slug 集合。
 *
 * 集中訂閱：`getProgressSync()` 每次都會重讀並 normalize localStorage，若讓每張
 * StoryCard 各自呼叫，一頁 20 張卡就是 20 次 parse（且每次進度變更再 20 次）。
 * 這裡以模組級快取讓同一次變更只 parse 一次，對齊 `useZoneProgress` 的集中式作法。
 */
const EMPTY: ReadonlySet<string> = new Set();

let cache: ReadonlySet<string> | null = null;
let bound = false;

/**
 * 快取失效必須與元件生命週期脫鉤：若只靠 consumer 的訂閱，使用者離開 /stories
 * （卡片 unmount → 退訂）後聽完一集、再返回時會讀到過期快取，星章不會出現。
 * 故首次使用時掛一個永不移除的模組級 listener。
 */
function ensureBound(): void {
  if (bound) return;
  bound = true;
  subscribeProgress(() => {
    cache = null;
  });
}

function subscribe(onStoreChange: () => void): () => void {
  ensureBound();
  return subscribeProgress(onStoreChange);
}

function getSnapshot(): ReadonlySet<string> {
  ensureBound();
  // 快照須維持參照穩定，否則 useSyncExternalStore 會無限重繪。
  if (cache === null) {
    cache = new Set(getProgressSync().engagement.storiesCompleted);
  }
  return cache;
}

/** SSR 無 localStorage；回固定空集合，hydration 後才補上真值。 */
function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

export function useCompletedStories(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
