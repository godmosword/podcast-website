"use client";

import { useMemo } from "react";
import { moonPath, moonWebpPath } from "@/lib/universe/map-art-src";
import decor from "@/components/decor/decor.module.css";
import styles from "./LandingBedtimeLayer.module.css";
import { useActiveLandingAnchor } from "./useActiveLandingAnchor";

type LandingBedtimeLayerProps = {
  segmentEffects: {
    anchorId: string;
    hideMoon: boolean;
    veil?: "warm-bottom";
  }[];
};

/**
 * 首頁睡前夜色疊層：依 `<html data-bedtime>` 顯示，不替換 hero 圖。
 * 月亮重用地圖黏土資產；純裝飾、不攔截點擊。
 */
export default function LandingBedtimeLayer({
  segmentEffects,
}: LandingBedtimeLayerProps) {
  const anchorIds = useMemo(
    () => segmentEffects.map((effect) => effect.anchorId),
    [segmentEffects],
  );
  const activeAnchorId =
    useActiveLandingAnchor(anchorIds) ?? segmentEffects[0]?.anchorId ?? "";

  const activeEffect = segmentEffects.find(
    (effect) => effect.anchorId === activeAnchorId,
  );
  const moonHidden = Boolean(activeEffect?.hideMoon);
  const warmVeil = activeEffect?.veil === "warm-bottom";

  return (
    // data-active-segment：視覺測試等夜色切到該段才截圖（平行跑時 observer 回呼會晚到）。
    <div className={styles.layer} aria-hidden data-active-segment={activeAnchorId}>
      <div className={`${styles.veil} ${warmVeil ? styles.veilWarm : ""}`} />
      <picture>
        <source srcSet={moonWebpPath()} type="image/webp" />
        <img
          className={`${styles.moon} ${decor.floatY} ${
            moonHidden ? styles.moonHidden : ""
          }`}
          src={moonPath()}
          alt=""
          width={64}
          height={64}
          decoding="async"
          draggable={false}
        />
      </picture>
    </div>
  );
}
