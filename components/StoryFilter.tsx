"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Story } from "@/data/content";
import StoriesViewToggle from "./StoriesViewToggle";
import StoryCard from "./StoryCard";
import VehicleSelect from "./VehicleSelect";
import TopicSelect from "./TopicSelect";
import { filterStories } from "./story-filtering";
import { playSfx } from "@/lib/sfx";
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
              <StoryCard story={story} index={i} hideMeta catalog />
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

/** 靜態殼 fallback：不讀 URL，避免 searchParams 把整頁打成 dynamic。 */
export function StoryFilterFallback(props: StoryFilterDataProps) {
  return <StoryFilter {...props} vehicle={null} tag={null} query="" />;
}

/** 小型 client island：只在這裡解讀可分享的 filter URL。 */
export function StoryFilterFromUrl(props: StoryFilterDataProps) {
  const searchParams = useSearchParams();
  const parsed = parseStoriesSearchParams(
    searchParams,
    props.vehicles,
    props.tags,
  );
  return <StoryFilter {...props} {...parsed} />;
}

export default StoryFilterFromUrl;
