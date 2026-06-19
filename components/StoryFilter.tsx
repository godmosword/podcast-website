"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { canScrollHorizontal, scrollChipIntoView } from "@/lib/chip-scroll";
import { useRouter } from "next/navigation";
import type { Story } from "@/data/content";
import { ChipButton } from "./Chip";
import StoryCard from "./StoryCard";
import VehicleClayIcon from "./VehicleClayIcon";
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
  const chipRowRef = useRef<HTMLDivElement>(null);
  const [chipRowScrollable, setChipRowScrollable] = useState(false);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());

  const updateChipScrollable = useCallback(() => {
    const el = chipRowRef.current;
    if (!el) return;
    setChipRowScrollable(canScrollHorizontal(el));
  }, []);

  useEffect(() => {
    setVehicle(initialVehicle);
  }, [initialVehicle]);

  useEffect(() => {
    const el = chipRowRef.current;
    if (!el) return;
    updateChipScrollable();
    const ro = new ResizeObserver(updateChipScrollable);
    ro.observe(el);
    window.addEventListener("resize", updateChipScrollable);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateChipScrollable);
    };
  }, [vehicles, updateChipScrollable]);

  useEffect(() => {
    const key = vehicle ?? "__all__";
    const chip = chipRefs.current.get(key);
    if (!chip) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollChipIntoView(chip, { behavior: reduced ? "auto" : "smooth" });
  }, [vehicle]);

  function registerChipRef(key: string) {
    return (node: HTMLButtonElement | null) => {
      if (node) chipRefs.current.set(key, node);
      else chipRefs.current.delete(key);
    };
  }

  function updateVehicle(nextVehicle: string | null) {
    playSfx("tap");
    setVehicle(nextVehicle);
    const params = new URLSearchParams();
    if (nextVehicle) params.set("vehicle", nextVehicle);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  const filtered = useMemo(() => {
    return filterStoriesForVehicle(stories, vehicle, featuredStorySlug);
  }, [featuredStorySlug, stories, vehicle]);

  const hasFilter = Boolean(vehicle);

  return (
    <section className={styles.section} aria-label="依車車找故事">
      <div className={styles.filterBar}>
        <div className={styles.filterHead}>
          <div className={styles.filterTitleBlock}>
            <h2 className={styles.filterSectionTitle}>找車車</h2>
          </div>
          <Link href="/topic" className={styles.topicLink}>
            找主題
          </Link>
        </div>

        <div
          className={styles.chipScrollWrap}
          data-scrollable={chipRowScrollable ? "true" : "false"}
        >
          <div ref={chipRowRef} className={styles.vehicleChipRow}>
            <ChipButton
              active={vehicle === null}
              buttonRef={registerChipRef("__all__")}
              onClick={() => updateVehicle(null)}
            >
              全部
            </ChipButton>
            {vehicles.map((v) => (
              <ChipButton
                key={v}
                className={styles.chipWithIcon}
                active={vehicle === v}
                buttonRef={registerChipRef(v)}
                onClick={() => updateVehicle(vehicle === v ? null : v)}
              >
                <VehicleClayIcon vehicle={v} size={24} />
                {v}
              </ChipButton>
            ))}
          </div>
        </div>

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
