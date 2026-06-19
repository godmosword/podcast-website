"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { canScrollHorizontal, scrollChipIntoView } from "@/lib/chip-scroll";
import { useRouter } from "next/navigation";
import type { Story } from "@/data/content";
import { ChipButton } from "./Chip";
import StoryCard from "./StoryCard";
import VehicleClayIcon from "./VehicleClayIcon";
import { searchStories, getVisibleVehicles } from "./story-filtering";
import { playSfx } from "@/lib/sfx";
import styles from "./StoryFilter.module.css";

type StoryFilterProps = {
  stories: Story[];
  vehicles: string[];
  featuredStorySlug?: string | null;
  /** 由 server 從 URL searchParams 傳入，確保首屏 HTML 含完整列表 */
  initialVehicle?: string | null;
};

const CHIP_ROW_ID = "vehicle-chip-row";

export default function StoryFilter({
  stories,
  vehicles,
  featuredStorySlug = null,
  initialVehicle = null,
}: StoryFilterProps) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<string | null>(initialVehicle);
  const [inputValue, setInputValue] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const isComposingRef = useRef(false);
  const chipRowRef = useRef<HTMLDivElement>(null);
  const [chipRowScrollable, setChipRowScrollable] = useState(false);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());

  const visibleVehicles = useMemo(
    () => getVisibleVehicles(vehicles, vehicle, expanded),
    [vehicles, vehicle, expanded],
  );
  const hasHiddenVehicles = visibleVehicles.length < vehicles.length;

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
  }, [visibleVehicles, expanded, updateChipScrollable]);

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

  function handleSearchChange(value: string) {
    setInputValue(value);
    // 中文 IME 組字期間先不套用，避免逐字閃爍；compositionEnd 再提交
    if (!isComposingRef.current) setCommittedQuery(value);
  }

  function clearSearch() {
    setInputValue("");
    setCommittedQuery("");
  }

  function resetFilters() {
    playSfx("tap");
    clearSearch();
    setVehicle(null);
    router.replace("/", { scroll: false });
  }

  const filtered = useMemo(
    () =>
      searchStories(stories, {
        query: committedQuery,
        vehicle,
        featuredStorySlug,
      }),
    [stories, committedQuery, vehicle, featuredStorySlug],
  );

  const hasFilter = Boolean(vehicle) || committedQuery.trim().length > 0;

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

        <div className={styles.searchWrap} role="search">
          <span className={styles.searchIcon} aria-hidden>
            🔍
          </span>
          <input
            type="search"
            inputMode="search"
            className={styles.searchInput}
            value={inputValue}
            placeholder="找故事、找車車…"
            aria-label="搜尋故事"
            onChange={(e) => handleSearchChange(e.target.value)}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              setCommittedQuery(e.currentTarget.value);
            }}
          />
          {inputValue.length > 0 && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={clearSearch}
              aria-label="清除搜尋"
            >
              ✕
            </button>
          )}
        </div>

        <div
          className={styles.chipScrollWrap}
          data-scrollable={chipRowScrollable ? "true" : "false"}
        >
          <div
            ref={chipRowRef}
            id={CHIP_ROW_ID}
            className={styles.vehicleChipRow}
          >
            <ChipButton
              active={vehicle === null}
              buttonRef={registerChipRef("__all__")}
              onClick={() => updateVehicle(null)}
            >
              全部
            </ChipButton>
            {visibleVehicles.map((v) => (
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
            {hasHiddenVehicles && !expanded && (
              <button
                type="button"
                className={styles.moreChip}
                aria-expanded={false}
                aria-controls={CHIP_ROW_ID}
                onClick={() => setExpanded(true)}
              >
                更多 ▾
              </button>
            )}
            {expanded && vehicles.length > getVisibleVehicles(vehicles, vehicle, false).length && (
              <button
                type="button"
                className={styles.moreChip}
                aria-expanded
                aria-controls={CHIP_ROW_ID}
                onClick={() => setExpanded(false)}
              >
                收合 ▴
              </button>
            )}
          </div>
        </div>

        <p className={styles.count}>
          {filtered.length} 則故事
          {hasFilter && (
            <button
              className={styles.clear}
              onClick={resetFilters}
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
        <p className={styles.empty}>找不到，換個關鍵字或車車試試 🚗</p>
      )}
    </section>
  );
}
