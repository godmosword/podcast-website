"use client";

import { useRouter } from "next/navigation";
import { ChipButton } from "./Chip";
import styles from "./StoryFilter.module.css";

type Props = {
  vehicles: string[];
  tags: string[];
  activeVehicle: string | null;
  activeTag: string | null;
};

/** 探索故事篩選 chips（僅互動層；列表由 Server Component 預先渲染）。 */
export default function StoryFilterChips({
  vehicles,
  tags,
  activeVehicle,
  activeTag,
}: Props) {
  const router = useRouter();

  function updateParams(nextVehicle: string | null, nextTag: string | null) {
    const params = new URLSearchParams();
    if (nextVehicle) params.set("vehicle", nextVehicle);
    if (nextTag) params.set("tag", nextTag);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  return (
    <>
      <p className={styles.groupLabel}>🚗 車種</p>
      <div className={styles.chips}>
        <ChipButton
          active={activeVehicle === null}
          onClick={() => updateParams(null, activeTag)}
        >
          全部
        </ChipButton>
        {vehicles.map((v) => (
          <ChipButton
            key={v}
            active={activeVehicle === v}
            onClick={() =>
              updateParams(activeVehicle === v ? null : v, activeTag)
            }
          >
            {v}
          </ChipButton>
        ))}
      </div>

      <p className={styles.groupLabel}>🏷️ 故事關鍵字</p>
      <div className={styles.chips}>
        <ChipButton
          active={activeTag === null}
          onClick={() => updateParams(activeVehicle, null)}
        >
          全部
        </ChipButton>
        {tags.map((t) => (
          <ChipButton
            key={t}
            active={activeTag === t}
            onClick={() =>
              updateParams(activeVehicle, activeTag === t ? null : t)
            }
          >
            {t}
          </ChipButton>
        ))}
      </div>
    </>
  );
}
