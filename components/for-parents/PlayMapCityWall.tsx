"use client";

import { useEffect, useRef } from "react";
import { uncataloguedNotice } from "@/lib/play-map-city-tiles";
import type { PlayMapCityWallProps } from "./PlayMapContract";
import styles from "./PlayMapCityWall.module.css";

const CITY_WALL_HEADING_ID = "play-map-city-wall-heading";

export function PlayMapCityWall({
  tiles,
  selectedCity,
  onToggleCity,
  uncataloguedCities,
}: PlayMapCityWallProps) {
  const rootRef = useRef<HTMLElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  /**
   * 「這次的縣市變更是磚牆自己觸發的，重繪後要把焦點交給誰」。
   * "chip" ＝ 收合鍵；字串 ＝ 該縣市的磚。
   */
  const pendingFocusRef = useRef<"chip" | string | null>(null);

  /**
   * 手機選定縣市後磚牆會 display:none、取消後收合鍵會 display:none——
   * 兩個方向都會讓焦點掉到 body。
   *
   * 焦點必須在**重繪之後**才交出去：按下去的當下目標還是隱藏的，
   * 對隱藏元素呼叫 focus() 沒有作用。
   *
   * 只有磚牆自己觸發的變更才搶焦點；從篩選面板的縣市 chip 或地圖 cluster
   * 選縣市時，焦點應該留在原地。offsetParent === null 代表桌面不收合，
   * 此時兩個目標都在畫面上，也不需要搬焦點。
   */
  useEffect(() => {
    const want = pendingFocusRef.current;
    if (!want) return;
    pendingFocusRef.current = null;
    const target =
      want === "chip"
        ? chipRef.current
        : rootRef.current?.querySelector<HTMLElement>(
            `[data-city="${CSS.escape(want)}"]`,
          );
    if (target && target.offsetParent !== null) target.focus();
  }, [selectedCity]);

  const handleTileClick = (city: string, active: boolean) => {
    pendingFocusRef.current = active ? city : "chip";
    onToggleCity(active ? null : city);
  };

  const handleCollapsedCancel = () => {
    if (selectedCity) pendingFocusRef.current = selectedCity;
    onToggleCity(null);
  };

  const notice = uncataloguedNotice(uncataloguedCities);

  return (
    <section
      ref={rootRef}
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
          onClick={handleCollapsedCancel}
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
                onClick={() => handleTileClick(tile.city, active)}
              >
                <span className={styles.tileCity}>{tile.city}</span>
                <span className={styles.tileCount}>{tile.statusLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className={styles.legend}>示意排列，非實際地理位置。{notice}</p>
    </section>
  );
}
