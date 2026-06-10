"use client";

import { useCallback, useState } from "react";
import Sparkle from "@/components/decor/Sparkle";
import decor from "@/components/decor/decor.module.css";
import type { Hotspot } from "@/lib/hotspots";
import { recordHotspotTap } from "@/lib/engagement";
import { playSfx } from "@/lib/sfx";
import styles from "./HotspotLayer.module.css";

type Props = {
  hotspots: Hotspot[];
  accent: string;
};

export default function HotspotLayer({ hotspots, accent }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());

  const handleTap = useCallback((hotspot: Hotspot) => {
    setActiveId(hotspot.id);
    setDoneIds((prev) => new Set(prev).add(hotspot.id));
    playSfx(hotspot.sfx ?? "tap");
    recordHotspotTap(hotspot.id);
  }, []);

  if (hotspots.length === 0) return null;

  return (
    <div className={styles.layer} aria-label="點按探索">
      {hotspots.map((hotspot) => {
        const isActive = activeId === hotspot.id;
        const isDone = doneIds.has(hotspot.id);
        return (
          <button
            key={hotspot.id}
            type="button"
            className={`${styles.btn} ${isDone ? styles.btnDone : ""}`}
            style={{
              left: `${hotspot.x * 100}%`,
              top: `${hotspot.y * 100}%`,
              width: `${hotspot.w * 100}%`,
              height: `${hotspot.h * 100}%`,
              borderColor: isDone ? accent : undefined,
            }}
            aria-label={`探索：${hotspot.label}`}
            aria-pressed={isDone}
            onClick={() => handleTap(hotspot)}
          >
            {isActive && (
              <>
                <span className={styles.tip} role="status">
                  {hotspot.tip}
                </span>
                <Sparkle
                  className={`${styles.sparkle} ${decor.sparkleAnim}`}
                  size={28}
                  color={accent}
                />
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
