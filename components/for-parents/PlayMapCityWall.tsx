"use client";

import { useEffect, useRef } from "react";
import { uncataloguedNotice } from "@/lib/play-map-city-tiles";
import type { PlayMapCityWallProps } from "./PlayMapContract";
import styles from "./PlayMapCityWall.module.css";

export const CITY_WALL_HEADING_ID = "play-map-city-wall-heading";

export function PlayMapCityWall({
  tiles,
  selectedCity,
  onToggleCity,
  uncataloguedCities,
}: PlayMapCityWallProps) {
  const chipRef = useRef<HTMLButtonElement>(null);

  /**
   * 手機選定縣市後磚牆會 display:none，焦點會掉到 body。
   * offsetParent === null 代表收合列自己也被藏起來（桌面不收合），此時不搶焦點。
   */
  useEffect(() => {
    if (!selectedCity) return;
    const chip = chipRef.current;
    if (chip && chip.offsetParent !== null) chip.focus();
  }, [selectedCity]);

  const notice = uncataloguedNotice(uncataloguedCities);

  return (
    <section
      className={styles.wall}
      aria-labelledby={CITY_WALL_HEADING_ID}
      data-selected={selectedCity ? "true" : "false"}
    >
      <h2 id={CITY_WALL_HEADING_ID} className={styles.heading}>
        選一個縣市
      </h2>

      <div className={styles.collapsed}>
        <button
          ref={chipRef}
          type="button"
          className={styles.collapsedChip}
          aria-label={`取消${selectedCity ?? ""}，改看全台`}
          onClick={() => onToggleCity(null)}
        >
          <span>{selectedCity}</span>
          <span aria-hidden>✕</span>
        </button>
      </div>

      <div className={styles.gridWrap}>
        <div className={styles.grid} role="group" aria-label="依縣市瀏覽">
          {tiles.map((tile) => {
            const active = tile.city === selectedCity;
            return (
              <button
                key={tile.city}
                type="button"
                className={styles.tile}
                data-status={tile.status}
                data-city={tile.city}
                style={
                  {
                    "--tile-row": tile.row,
                    "--tile-col": tile.col,
                    "--tile-density": tile.density,
                  } as React.CSSProperties
                }
                aria-pressed={active}
                aria-label={tile.ariaLabel}
                disabled={tile.status === "uncatalogued" && !active}
                onClick={() => onToggleCity(active ? null : tile.city)}
              >
                <span className={styles.tileCity}>{tile.city}</span>
                <span className={styles.tileCount}>{tile.statusLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className={styles.legend}>
        示意排列，非實際地理位置。{notice}
      </p>
    </section>
  );
}
