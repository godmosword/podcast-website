"use client";

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
  const tagParam = searchParams.get("tag");

  const [vehicle, setVehicle] = useState<string | null>(vehicleParam);
  const [tag, setTag] = useState<string | null>(tagParam);

  useEffect(() => {
    setVehicle(vehicleParam);
    setTag(tagParam);
  }, [vehicleParam, tagParam]);

  function updateParams(nextVehicle: string | null, nextTag: string | null) {
    const params = new URLSearchParams();
    if (nextVehicle) params.set("vehicle", nextVehicle);
    if (nextTag) params.set("tag", nextTag);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      const okVehicle = vehicle === null || s.vehicle === vehicle;
      const okTag = tag === null || (s.tags ?? []).includes(tag);
      return okVehicle && okTag;
    });
  }, [stories, vehicle, tag]);

  return (
    <section>
      <div className={styles.filterBlock}>
        <h2 className={styles.filterHeading}>用分類找故事</h2>

        <p className={styles.groupLabel}>🚗 車種</p>
        <div className={styles.chips}>
          <ChipButton
            active={vehicle === null}
            onClick={() => updateParams(null, tag)}
          >
            全部
          </ChipButton>
          {vehicles.map((v) => (
            <ChipButton
              key={v}
              active={vehicle === v}
              onClick={() =>
                updateParams(vehicle === v ? null : v, tag)
              }
            >
              {v}
            </ChipButton>
          ))}
        </div>

        <p className={styles.groupLabel}>🏷️ 故事關鍵字</p>
        <div className={styles.chips}>
          <ChipButton active={tag === null} onClick={() => updateParams(vehicle, null)}>
            全部
          </ChipButton>
          {tags.map((t) => (
            <ChipButton
              key={t}
              active={tag === t}
              onClick={() => updateParams(vehicle, tag === t ? null : t)}
            >
              {t}
            </ChipButton>
          ))}
        </div>
      </div>

      <p className={styles.count}>
        {filtered.length} 則故事
        {(vehicle || tag) && (
          <button
            className={styles.clear}
            onClick={() => updateParams(null, null)}
            type="button"
          >
            清除篩選
          </button>
        )}
      </p>

      {filtered.length > 0 ? (
        <ul className={styles.list}>
          {filtered.map((story) => (
            <li key={story.slug}>
              <StoryCard story={story} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>沒有符合的故事，試試其他車車或關鍵字吧 🚗</p>
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
