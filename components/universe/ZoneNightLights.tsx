"use client";

import type { CSSProperties } from "react";
import { getZoneLights } from "@/data/universe-zone-lights";
import type { ZoneId } from "@/data/universe-zones";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
import styles from "./ZoneNightLights.module.css";

type Props = {
  zoneId: ZoneId;
  night: boolean;
  reduced?: boolean;
  paused?: boolean;
};

/**
 * 夜間窗燈層（零資產點燈）。
 *
 * 三個不渲染的條件，順序即成本由低到高：
 * 1. 非夜間 —— 日間訪客完全不掛載。
 * 2. 該島已有夜間點燈美術（`hasNightArt`）—— 燈已烘進圖裡，再疊 CSS 燈會過曝。
 *    這是 D4 資產逐島落地時的自動退場開關，不需要另外改碼。
 * 3. 該島沒有定義燈點。
 */
export default function ZoneNightLights({
  zoneId,
  night,
  reduced = false,
  paused = false,
}: Props) {
  if (!night) return null;

  const tile = getZoneArtTile(zoneId);
  if (tile.mode === "island" && tile.hasNightArt) return null;

  const lights = getZoneLights(zoneId);
  if (lights.length === 0) return null;

  return (
    <span
      className={styles.layer}
      data-paused={paused || undefined}
      aria-hidden="true"
    >
      {lights.map((light, i) => (
        <span
          key={i}
          className={reduced ? styles.light : `${styles.light} ${styles.breathe}`}
          style={
            {
              left: `${light.u * 100}%`,
              top: `${light.v * 100}%`,
              width: `${light.size * 100}%`,
              "--light-color": light.color,
              animationDelay: reduced ? undefined : `${light.delayMs}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
