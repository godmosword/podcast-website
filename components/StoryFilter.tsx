"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Story } from "@/data/content";
import StoriesViewToggle from "./StoriesViewToggle";
import StoryCard from "./StoryCard";
import VehicleSelect from "./VehicleSelect";
import TopicSelect from "./TopicSelect";
import { filterStories } from "./story-filtering";
import { playSfx } from "@/lib/sfx";
import { useCompletedStories } from "@/hooks/useCompletedStories";
import {
  parseStoriesSearchParams,
  storiesSearchQuery,
} from "@/lib/stories-search";
import styles from "./StoryFilter.module.css";

export type StoryFilterDataProps = {
  stories: Story[];
  vehicles: string[];
  tags: string[];
  featuredStorySlug?: string | null;
};

type StoryFilterProps = StoryFilterDataProps & {
  vehicle: string | null;
  tag: string | null;
  query: string;
};

export function StoryFilter({
  stories,
  vehicles,
  tags,
  featuredStorySlug = null,
  vehicle,
  tag,
  query,
}: StoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const filterBase = pathname === "/stories" ? "/stories" : "/";
  const completedStories = useCompletedStories();

  function pushFilters(
    nextVehicle: string | null,
    nextTag: string | null,
    nextQuery: string,
  ) {
    const qs = storiesSearchQuery(nextVehicle, nextTag, nextQuery);
    router.replace(qs ? `${filterBase}?${qs}` : filterBase, { scroll: false });
  }

  function updateVehicle(nextVehicle: string | null) {
    pushFilters(nextVehicle, tag, query);
  }

  function updateTag(nextTag: string | null) {
    pushFilters(vehicle, nextTag, query);
  }

  function clearFilters() {
    playSfx("tap");
    router.replace(filterBase, { scroll: false });
  }

  const filtered = useMemo(
    () => filterStories(stories, { vehicle, tag, query, featuredStorySlug }),
    [stories, vehicle, tag, query, featuredStorySlug],
  );

  const hasFilter = Boolean(vehicle || tag || query.trim());

  return (
    <section className={styles.section} aria-label="找故事">
      <div className={styles.filterBar}>
        <div className={styles.titleRow}>
          <h2 className={styles.filterTitle}>找故事</h2>
          <StoriesViewToggle />
        </div>

        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <VehicleSelect
              vehicles={vehicles}
              value={vehicle}
              onChange={updateVehicle}
            />
          </div>
          <div className={styles.filterField}>
            <TopicSelect tags={tags} value={tag} onChange={updateTag} />
          </div>
        </div>

        <div className={styles.footer}>
          {query.trim() ? (
            <p className={styles.query} title={query.trim()}>
              搜尋「{query.trim()}」
            </p>
          ) : null}
          <p className={styles.count}>{filtered.length} 則故事</p>
          {hasFilter && (
            <button
              className={styles.clear}
              onClick={clearFilters}
              type="button"
            >
              清除篩選
            </button>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className={`${styles.list} ${styles.catalog}`}>
          {filtered.map((story, i) => (
            <li key={story.slug} className={styles.listItem}>
              <StoryCard
                story={story}
                index={i}
                hideMeta
                catalog
                completedStories={completedStories}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty} role="status">
          <p className={styles.emptyText}>
            沒有符合的故事，試試其他車車或主題吧{" "}
            <span aria-hidden>🚗</span>
          </p>
          {hasFilter ? (
            <button
              className={styles.clear}
              onClick={clearFilters}
              type="button"
            >
              清除篩選
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

type ParsedFilters = { vehicle: string | null; tag: string | null; query: string };

const EMPTY_FILTERS: ParsedFilters = { vehicle: null, tag: null, query: "" };

/**
 * 唯一讀 URL 的小島。`useSearchParams` 在靜態預渲染時會 suspend，所以它必須
 * 在自己的 Suspense 裡；它什麼都不渲染，只把解析結果推給外層。
 */
function StoryFilterUrlSync({
  vehicles,
  tags,
  onParams,
}: Pick<StoryFilterDataProps, "vehicles" | "tags"> & {
  onParams: (next: ParsedFilters) => void;
}) {
  const searchParams = useSearchParams();
  const parsed = parseStoriesSearchParams(searchParams, vehicles, tags);
  useEffect(() => {
    onParams(parsed);
    // parsed 每次 render 都是新物件；以三個欄位當依賴才不會無限觸發。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.vehicle, parsed.tag, parsed.query, onParams]);
  return null;
}

/**
 * 找故事區塊的宿主：頁面保持靜態，但**清單不放在 Suspense 裡**。
 *
 * 舊做法是 `<Suspense fallback={<未篩選清單>}><讀 URL 後渲染清單/></Suspense>`。
 * Suspense 從 fallback 切到內容不是 reconcile 而是整棵換掉——28 張卡在 hydration
 * 時被卸載再重新 mount，6× CPU 下是一次 187ms 的 layout（dirty 208/232），
 * 也是 /stories 過不了 200ms 長任務門檻的主因。
 *
 * 現在清單由本元件的 state 驅動，SSR 與首次 hydration 都是未篩選（跟舊 fallback
 * 一模一樣），URL 小島 resolve 後只更新 state，同一個 <StoryFilter> 實例原地
 * re-render，卡片走 reconcile；沒有篩選參數時 DOM 一個節點都不動。
 */
export function StoryFilterHost(props: StoryFilterDataProps) {
  const [params, setParams] = useState<ParsedFilters>(EMPTY_FILTERS);
  return (
    <>
      <StoryFilter {...props} {...params} />
      <Suspense fallback={null}>
        <StoryFilterUrlSync
          vehicles={props.vehicles}
          tags={props.tags}
          onParams={setParams}
        />
      </Suspense>
    </>
  );
}

export default StoryFilterHost;
