"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Story } from "@/data/stories";
import { ChipButton } from "./Chip";
import StoryCard from "./StoryCard";
import VehicleClayIcon from "./VehicleClayIcon";
import { playSfx } from "@/lib/sfx";
import styles from "./StoryFilter.module.css";

type StoryFilterProps = {
  stories: Story[];
  vehicles: string[];
};

function StoryFilterInner({ stories, vehicles }: StoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleParam = searchParams.get("vehicle");

  const [vehicle, setVehicle] = useState<string | null>(vehicleParam);

  useEffect(() => {
    setVehicle(vehicleParam);
  }, [vehicleParam]);

  function updateVehicle(nextVehicle: string | null) {
    playSfx("tap");
    const params = new URLSearchParams();
    if (nextVehicle) params.set("vehicle", nextVehicle);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  const filtered = useMemo(() => {
    return stories.filter(
      (s) => vehicle === null || s.vehicle === vehicle,
    );
  }, [stories, vehicle]);

  const hasFilter = Boolean(vehicle);

  return (
    <section aria-label="依車車找故事">
      <div className={styles.filterBar}>
        <div className={styles.filterHead}>
          <div>
            <h2 className={styles.filterSectionTitle}>依車車找故事</h2>
            <p className={styles.filterHint}>點車車，下面故事會變喔</p>
          </div>
          <Link href="/topic" className={styles.topicLink}>
            依主題找 →
          </Link>
        </div>

        <div className={styles.vehicleChipRow}>
          <ChipButton
            active={vehicle === null}
            onClick={() => updateVehicle(null)}
          >
            全部
          </ChipButton>
          {vehicles.map((v) => (
            <ChipButton
              key={v}
              className={styles.chipWithIcon}
              active={vehicle === v}
              onClick={() => updateVehicle(vehicle === v ? null : v)}
            >
              <VehicleClayIcon vehicle={v} size={24} />
              {v}
            </ChipButton>
          ))}
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

export default function StoryFilter(props: StoryFilterProps) {
  return (
    <Suspense fallback={<p className={styles.empty}>載入故事中…</p>}>
      <StoryFilterInner {...props} />
    </Suspense>
  );
}
