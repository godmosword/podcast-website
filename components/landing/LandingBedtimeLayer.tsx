"use client";

import { useEffect, useState } from "react";
import { moonPath, moonWebpPath } from "@/lib/universe/map-art-src";
import decor from "@/components/decor/decor.module.css";
import { useLandingScroll } from "./LandingScrollContext";
import styles from "./LandingBedtimeLayer.module.css";

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
  const landingScroll = useLandingScroll();
  const [activeAnchorId, setActiveAnchorId] = useState(
    segmentEffects[0]?.anchorId ?? "",
  );

  useEffect(() => {
    const targets = segmentEffects
      .map((effect) => document.getElementById(effect.anchorId))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        const active = [...ratios.entries()].sort((a, b) => b[1] - a[1])[0];
        if (active?.[1] > 0) setActiveAnchorId((active[0] as HTMLElement).id);
      },
      {
        root: landingScroll?.scrollRootRef.current ?? null,
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.5, 1],
      },
    );
    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, [landingScroll, segmentEffects]);

  const activeEffect = segmentEffects.find(
    (effect) => effect.anchorId === activeAnchorId,
  );
  const moonHidden = Boolean(activeEffect?.hideMoon);
  const warmVeil = activeEffect?.veil === "warm-bottom";

  return (
    <div className={styles.layer} aria-hidden>
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
