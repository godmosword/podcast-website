"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Story } from "@/data/content";
import StoryCard from "./StoryCard";
import VehicleSelect from "./VehicleSelect";
import { filterStoriesForVehicle } from "./story-filtering";
import { playSfx } from "@/lib/sfx";
import styles from "./StoryFilter.module.css";

type StoryFilterProps = {
  stories: Story[];
  vehicles: string[];
  featuredStorySlug?: string | null;
  /** 由 server 從 URL searchParams 傳入，確保首屏 HTML 含完整列表 */
  initialVehicle?: string | null;
};

export default function StoryFilter({
  stories,
  vehicles,
  featuredStorySlug = null,
  initialVehicle = null,
}: StoryFilterProps) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<string | null>(initialVehicle);

  useEffect(() => {
    setVehicle(initialVehicle);
  }, [initialVehicle]);

  function updateVehicle(nextVehicle: string | null) {
    playSfx("tap");
    setVehicle(nextVehicle);
    const params = new URLSearchParams();
    if (nextVehicle) params.set("vehicle", nextVehicle);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  const filtered = useMemo(
    () => filterStoriesForVehicle(stories, vehicle, featuredStorySlug),
    [stories, vehicle, featuredStorySlug],
  );

  const hasFilter = Boolean(vehicle);

  return (
    <section className={styles.section} aria-label="找車車">
      <div className={styles.filterBar}>
        <div className={styles.filterHead}>
          <div className={styles.filterTitleBlock}>
            <h2 className={styles.filterSectionTitle}>找車車</h2>
          </div>
          <Link href="/topic" className={styles.topicLink}>
            找主題
          </Link>
        </div>

        <VehicleSelect
          vehicles={vehicles}
          value={vehicle}
          onChange={updateVehicle}
        />

        <p className={styles.count}>
          {filtered.length} 則故事
          {hasFilter && (
            <button
              className={styles.clear}
              onClick={() => updateVehicle(null)}
              type="button"
            >
              清除
            </button>
          )}
        </p>
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
        <p className={styles.empty}>沒有這種車車的故事，試試其他車車吧 🚗</p>
      )}
    </section>
  );
}
