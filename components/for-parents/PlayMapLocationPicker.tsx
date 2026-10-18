"use client";

import { useEffect, useRef } from "react";
import { uncataloguedNotice } from "@/lib/play-map-regions";
import type { PlayMapLocationPickerProps } from "./PlayMapContract";
import Icon from "@/components/ui/Icon";
import styles from "./PlayMapLocationPicker.module.css";

const HEADING_ID = "play-map-location-heading";

export function PlayMapLocationPicker({
  layout = "stack",
  regions,
  selectedCity,
  onToggleCity,
  uncataloguedCities,
  nearMeActive,
  geoStatus,
  onNearMe,
}: PlayMapLocationPickerProps) {
  const rootRef = useRef<HTMLElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  /**
   * 「這次的縣市變更是選擇器自己觸發的，重繪後要把焦點交給誰」。
   * "chip" ＝ 收合鍵；字串 ＝ 該縣市的按鈕。
   */
  const pendingFocusRef = useRef<"chip" | string | null>(null);

  /**
   * 手機選定縣市後分組會 display:none、取消後收合鍵會 display:none——
   * 兩個方向都會讓焦點掉到 body。
   *
   * 焦點必須在**重繪之後**才交出去：按下去的當下目標還是隱藏的，
   * 對隱藏元素呼叫 focus() 沒有作用。
   *
   * 只有選擇器自己觸發的變更才搶焦點；從地圖 cluster 選縣市時，
   * 焦點應該留在原地。offsetParent === null 代表桌面不收合，
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

  const handleCityClick = (city: string, active: boolean) => {
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
      className={styles.picker}
      aria-labelledby={HEADING_ID}
      data-selected={selectedCity ? "true" : "false"}
      data-layout={layout}
    >
      <div className={styles.headRow}>
        <h2 id={HEADING_ID} className={styles.heading}>
          在哪裡玩？
        </h2>
        <button
          ref={chipRef}
          type="button"
          className={styles.collapsedChip}
          aria-label={`取消${selectedCity ?? ""}，改看全台`}
          onClick={handleCollapsedCancel}
        >
          <span>{selectedCity}</span>
          <Icon name="close" size={16} />
        </button>
        <button
          type="button"
          className={styles.nearMe}
          aria-pressed={nearMeActive}
          aria-busy={geoStatus === "pending"}
          data-quick-filter="nearby"
          onClick={onNearMe}
        >
          <Icon name="map-pin" size={18} />
          我附近
        </button>
      </div>

      {geoStatus === "denied" ? (
        <p className={styles.geoHint} role="status">
          無法定位。可改選縣市，或稍後再開啟定位。
        </p>
      ) : null}
      {geoStatus === "pending" ? (
        <p className={styles.geoHint} role="status">
          正在取得位置…
        </p>
      ) : null}

      <div className={styles.regions} role="group" aria-label="依縣市瀏覽">
        {regions.map((region) => {
          const labelId = `play-map-region-${region.key}`;
          return (
            <div key={region.key} className={styles.region}>
              <span id={labelId} className={styles.regionLabel}>
                {region.label}
              </span>
              <div
                className={styles.cityGrid}
                role="group"
                aria-labelledby={labelId}
              >
                {region.cities.map((item) => {
                  const active = item.city === selectedCity;
                  return (
                    <button
                      key={item.city}
                      type="button"
                      className={styles.city}
                      data-city={item.city}
                      data-status={item.status}
                      aria-pressed={active}
                      aria-label={item.ariaLabel}
                      onClick={() => handleCityClick(item.city, active)}
                    >
                      <span>{item.city}</span>
                      <span className={styles.cityCount}>{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {notice ? <p className={styles.notice}>{notice}</p> : null}
    </section>
  );
}
