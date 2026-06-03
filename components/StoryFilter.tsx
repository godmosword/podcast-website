"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Story } from "@/data/stories";
import { ChipButton } from "./Chip";
import StoryCard from "./StoryCard";
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

  useEffect(() => {
    setVehicle(vehicleParam);
  }, [vehicleParam]);

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

  return (
    <section>
      <div className={styles.filterBlock}>
        <h2 className={styles.filterHeading}>用分類找故事</h2>

        <p className={styles.groupLabel}>🚗 車種</p>
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
          <p className={styles.topicLabel}>🏷️ 主題標籤</p>
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

      <p className={styles.count}>
        {filtered.length} 則故事
        {(vehicle || activeTag) && (
          <button
            className={styles.clear}
            onClick={() => {
              updateVehicle(null);
              setActiveTag(null);
            }}
            type="button"
          >
            清除篩選
          </button>
        )}
      </p>

      {filtered.length > 0 ? (
        <ul className={styles.list}>
          {filtered.map((story, i) => (
            <li key={story.slug}>
              <StoryCard story={story} index={i} />
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
