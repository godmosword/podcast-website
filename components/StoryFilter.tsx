"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Story } from "@/data/stories";
import { ChipButton } from "./Chip";
import StoryCard from "./StoryCard";
import Doodle from "./decor/Doodle";
import RoughFrame from "./decor/RoughFrame";
import decor from "./decor/decor.module.css";
import styles from "./StoryFilter.module.css";

type StoryFilterProps = {
  stories: Story[];
  vehicles: string[];
  tags: string[];
};

function StoryFilterInner({ stories, vehicles, tags }: StoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleParam = searchParams.get("vehicle");

  const [vehicle, setVehicle] = useState<string | null>(vehicleParam);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setVehicle(vehicleParam);
  }, [vehicleParam]);

  // 抽屜開啟時鎖住背景捲動，並支援 Esc 關閉
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function updateVehicle(nextVehicle: string | null) {
    const params = new URLSearchParams();
    if (nextVehicle) params.set("vehicle", nextVehicle);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      const okVehicle = vehicle === null || s.vehicle === vehicle;
      const okTag =
        activeTag === null || (s.tags ?? []).includes(activeTag);
      return okVehicle && okTag;
    });
  }, [stories, vehicle, activeTag]);

  const hasFilter = Boolean(vehicle || activeTag);

  function clearAll() {
    updateVehicle(null);
    setActiveTag(null);
  }

  return (
    <section>
      {/* 目前故事數 */}
      <p className={styles.count}>
        {filtered.length} 則故事
        {hasFilter && (
          <button className={styles.clear} onClick={clearAll} type="button">
            清除
          </button>
        )}
      </p>

      {/* 浮動篩選按鈕（固定左下角，與抽屜同側；抽屜開啟時淡出） */}
      <button
        type="button"
        className={styles.fab}
        data-hidden={open || undefined}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="story-filter-drawer"
        tabIndex={open ? -1 : undefined}
      >
        <span aria-hidden>🔍</span>
        用分類找故事
        {hasFilter && <span className={styles.filterDot} aria-hidden />}
      </button>

      {/* 抽屜遮罩 */}
      <div
        className={styles.overlay}
        data-open={open || undefined}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* 側邊篩選抽屜 */}
      <aside
        id="story-filter-drawer"
        className={styles.drawer}
        data-open={open || undefined}
        role="dialog"
        aria-modal="true"
        aria-label="用分類找故事"
      >
        <div className={styles.drawerHead}>
          <Doodle
            kind="squiggle"
            size={30}
            color="var(--c-pink)"
            className={`${decor.doodle} ${decor.tiltA}`}
            style={{ left: "-2px", top: "-6px" }}
          />
          <h2 className={styles.drawerTitle}>用分類找故事</h2>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => setOpen(false)}
            aria-label="關閉篩選"
          >
            ✕
          </button>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.filterBlock}>
            <RoughFrame color="var(--c-sky)" rough={2} width={3} />
            <p className={styles.groupLabel}>
              <span className="marker marker-sky">🚗 車種</span>
            </p>
            <div className={styles.chips}>
              <ChipButton
                active={vehicle === null}
                onClick={() => updateVehicle(null)}
              >
                全部
              </ChipButton>
              {vehicles.map((v) => (
                <ChipButton
                  key={v}
                  active={vehicle === v}
                  onClick={() => updateVehicle(vehicle === v ? null : v)}
                >
                  {v}
                </ChipButton>
              ))}
            </div>
          </div>

          <div className={styles.topicBlock}>
            <div className={styles.topicHeader}>
              <p className={styles.topicLabel}>
                <span className="marker marker-pink">🏷️ 主題標籤</span>
              </p>
              <Link href="/topic" className={styles.topicIndexLink}>
                全部主題
              </Link>
            </div>
            <div className={styles.chips}>
              <ChipButton
                className={`${styles.topicChip} ${activeTag === null ? styles.topicChipActive : ""}`}
                onClick={() => setActiveTag(null)}
              >
                全部
              </ChipButton>
              {tags.map((t) => (
                <ChipButton
                  key={t}
                  className={`${styles.topicChip} ${activeTag === t ? styles.topicChipActive : ""}`}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                >
                  {t}
                </ChipButton>
              ))}
            </div>
            {activeTag && (
              <p className={styles.topicShare}>
                分享此主題：
                <Link href={`/topic/${encodeURIComponent(activeTag)}`}>
                  /topic/{activeTag}
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className={styles.drawerFoot}>
          {hasFilter && (
            <button
              type="button"
              className={styles.drawerClear}
              onClick={clearAll}
            >
              清除篩選
            </button>
          )}
          <button
            type="button"
            className={styles.drawerApply}
            onClick={() => setOpen(false)}
          >
            查看 {filtered.length} 則故事
          </button>
        </div>
      </aside>

      {filtered.length > 0 ? (
        <ul className={styles.list}>
          {filtered.map((story, i) => (
            <li key={story.slug}>
              <StoryCard story={story} index={i} hideMeta />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>沒有符合的故事，試試其他車車或主題吧 🚗</p>
      )}
    </section>
  );
}

export default function StoryFilter(props: StoryFilterProps) {
  return (
    <Suspense fallback={<p className={styles.empty}>載入故事中…</p>}>
      <StoryFilterInner {...props} />
    </Suspense>
  );
}
