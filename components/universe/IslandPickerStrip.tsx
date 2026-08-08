"use client";

import type { CSSProperties } from "react";
import type { ZoneDef } from "@/data/universe-zones";
import { MAP_PICKER_HEIGHT } from "@/lib/universe/map-camera-utils";
import { pngToWebp } from "@/lib/universe/png-to-webp";
import styles from "./IslandPickerStrip.module.css";

export type IslandPickerStripProps = {
  zones: readonly ZoneDef[];
  /** 與地圖點島同一路徑（router.push），不改相機核心。 */
  onSelect: (zone: ZoneDef) => void;
  /** 目前進島中的 zone（世界層通常為 null）。 */
  activeZoneId?: string | null;
};

/**
 * 手機世界層底部大島選擇列：橫滑 chip，觸控目標 ≥56×72。
 * 桌面以 CSS 隱藏；chip 用 data-picker-zone（勿用 data-zone，以免 e2e 撞島 button）。
 */
export default function IslandPickerStrip({
  zones,
  onSelect,
  activeZoneId = null,
}: IslandPickerStripProps) {
  return (
    <nav
      className={styles.strip}
      aria-label="選擇島嶼"
      style={{ "--map-picker-height": `${MAP_PICKER_HEIGHT}px` } as CSSProperties}
      data-testid="island-picker-strip"
    >
      <ul className={styles.list} role="list">
        {zones.map((zone) => {
          const label = zone.shortName ?? zone.name;
          const locked = zone.status !== "open";
          const active = zone.id === activeZoneId;
          const src = zone.artTile ?? `/adventures/zones/${zone.id}.png`;
          const webp = pngToWebp(src);
          return (
            <li key={zone.id} className={styles.item}>
              <button
                type="button"
                className={styles.chip}
                data-picker-zone={zone.id}
                data-status={zone.status}
                data-active={active || undefined}
                aria-label={
                  locked
                    ? `${label}（還沒蓋好）`
                    : active
                      ? `${label}（目前在這裡，再點一次回樂園）`
                      : `去${label}`
                }
                aria-current={active ? "true" : undefined}
                onClick={() => onSelect(zone)}
              >
                <span className={styles.thumb} aria-hidden="true">
                  <picture>
                    <source type="image/webp" srcSet={webp} />
                    <img src={src} alt="" width={48} height={48} decoding="async" />
                  </picture>
                </span>
                <span className={styles.name}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
