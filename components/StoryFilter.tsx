"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Story } from "@/data/content";
import StoryCard from "./StoryCard";
import VehicleSelect from "./VehicleSelect";
import TopicSelect from "./TopicSelect";
import { filterStories } from "./story-filtering";
import { playSfx } from "@/lib/sfx";
import styles from "./StoryFilter.module.css";

type StoryFilterProps = {
  stories: Story[];
  vehicles: string[];
  tags: string[];
  featuredStorySlug?: string | null;
  initialVehicle?: string | null;
  initialTag?: string | null;
  initialQuery?: string;
};

export default function StoryFilter({
  stories,
  vehicles,
  tags,
  featuredStorySlug = null,
  initialVehicle = null,
  initialTag = null,
  initialQuery = "",
}: StoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const filterBase = pathname === "/stories" ? "/stories" : "/";
  const [vehicle, setVehicle] = useState<string | null>(initialVehicle);
  const [tag, setTag] = useState<string | null>(initialTag);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setVehicle(initialVehicle);
  }, [initialVehicle]);

  useEffect(() => {
    setTag(initialTag);
  }, [initialTag]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function pushFilters(
    nextVehicle: string | null,
    nextTag: string | null,
    nextQuery: string,
  ) {
    const params = new URLSearchParams();
    if (nextVehicle) params.set("vehicle", nextVehicle);
    if (nextTag) params.set("tag", nextTag);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    const qs = params.toString();
    router.replace(qs ? `${filterBase}?${qs}` : filterBase, { scroll: false });
  }

  function updateVehicle(nextVehicle: string | null) {
    setVehicle(nextVehicle);
    pushFilters(nextVehicle, tag, query);
  }

  function updateTag(nextTag: string | null) {
    setTag(nextTag);
    pushFilters(vehicle, nextTag, query);
  }

  function clearFilters() {
    playSfx("tap");
    setVehicle(null);
    setTag(null);
    setQuery("");
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
        <h2 className={styles.filterTitle}>找故事</h2>

        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <span className={styles.fieldLabel} id="filter-vehicle-label">
              車車
            </span>
            <VehicleSelect
              vehicles={vehicles}
              value={vehicle}
              onChange={updateVehicle}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.fieldLabel} id="filter-topic-label">
              主題
            </span>
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
        <ul className={styles.list}>
          {filtered.map((story, i) => (
            <li key={story.slug}>
              <StoryCard story={story} index={i} hideMeta />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>
          沒有符合的故事，試試其他車車或主題吧 🚗
        </p>
      )}
    </section>
  );
}
