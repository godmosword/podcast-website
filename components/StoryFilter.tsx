"use client";

import { useMemo, useState } from "react";
import type { Story } from "@/data/stories";
import StoryCard from "./StoryCard";
import styles from "./StoryFilter.module.css";

type StoryFilterProps = {
  stories: Story[]; // 已排序（由新到舊）
  vehicles: string[];
  tags: string[];
};

export default function StoryFilter({
  stories,
  vehicles,
  tags,
}: StoryFilterProps) {
  const [vehicle, setVehicle] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);

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
          <Chip active={vehicle === null} onClick={() => setVehicle(null)}>
            全部
          </Chip>
          {vehicles.map((v) => (
            <Chip
              key={v}
              active={vehicle === v}
              onClick={() => setVehicle(vehicle === v ? null : v)}
            >
              {v}
            </Chip>
          ))}
        </div>

        <p className={styles.groupLabel}>🏷️ 故事關鍵字</p>
        <div className={styles.chips}>
          <Chip active={tag === null} onClick={() => setTag(null)}>
            全部
          </Chip>
          {tags.map((t) => (
            <Chip
              key={t}
              active={tag === t}
              onClick={() => setTag(tag === t ? null : t)}
            >
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <p className={styles.count}>
        {filtered.length} 則故事
        {(vehicle || tag) && (
          <button
            className={styles.clear}
            onClick={() => {
              setVehicle(null);
              setTag(null);
            }}
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
        <p className={styles.empty}>沒有符合的故事，換個分類看看吧 🚧</p>
      )}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.chip} ${active ? styles.chipActive : ""}`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
