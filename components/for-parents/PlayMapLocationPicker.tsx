"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { uncataloguedNotice } from "@/lib/play-map-regions";
import { LOCATION_DIALOG_ID, type PlayMapLocationPickerProps } from "./PlayMapContract";
import { usePlayMapModal } from "./usePlayMapModal";
import styles from "./PlayMapLocationPicker.module.css";

const HEADING_ID = "play-map-location-heading";

/** ≥980 面板貼在觸發鈕下方；手機是底部 sheet，不吃這兩個值。 */
function useAnchor(open: boolean, triggerRef: PlayMapLocationPickerProps["returnFocusRef"]) {
  const [anchor, setAnchor] = useState<CSSProperties>({});
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({
        "--anchor-top": `${Math.round(rect.bottom + 8)}px`,
        "--anchor-left": `${Math.round(rect.left)}px`,
      } as CSSProperties);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, triggerRef]);
  return anchor;
}

/**
 * 選縣市面板（dialog）：我附近、全台、北中南分組縣市、未收錄說明。
 * 數字＝目前情境＋更多條件在該縣市的筆數（不套縣市本身）；0 筆虛線、仍可點。
 * 選完由呼叫端關閉、把位置列捲到頂；焦點回觸發鈕（usePlayMapModal）。
 */
export function PlayMapLocationPicker({
  open,
  onClose,
  returnFocusRef,
  regions,
  allCount,
  selectedCity,
  onSelectCity,
  uncataloguedCities,
  scenarioLabel,
  nearMeActive,
  geoStatus,
  onNearMe,
}: PlayMapLocationPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  usePlayMapModal({ open, onClose, rootRef, returnFocusRef });
  useFocusTrap(open, panelRef, { returnFocus: false });
  const anchor = useAnchor(open, returnFocusRef);

  if (!open || typeof document === "undefined") return null;

  const notice = uncataloguedNotice(uncataloguedCities);
  const allActive = selectedCity === null && !nearMeActive;

  return createPortal(
    <div
      ref={rootRef}
      className={styles.backdrop}
      data-play-map-location-backdrop
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        id={LOCATION_DIALOG_ID}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={HEADING_ID}
        style={anchor}
      >
        <div className={styles.headRow}>
          <h2 id={HEADING_ID} className={styles.heading}>
            去哪裡玩？
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label="關閉"
            onClick={onClose}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <p className={styles.hint}>
          {scenarioLabel
            ? `數字是「${scenarioLabel}」的地方數`
            : "數字是目前條件的地方數"}
        </p>

        <div className={styles.topRow}>
          <button
            type="button"
            className={styles.option}
            aria-pressed={nearMeActive}
            aria-busy={geoStatus === "pending"}
            data-location-option="nearby"
            onClick={onNearMe}
          >
            <Icon name="map-pin" size={18} />
            我附近
          </button>
          <button
            type="button"
            className={styles.option}
            aria-pressed={allActive}
            aria-label={`全台，${allCount} 處`}
            data-location-option="all"
            onClick={() => onSelectCity(null)}
          >
            全台
            <span className={styles.cityCount}>{allCount}</span>
          </button>
        </div>

        {geoStatus === "denied" ? (
          <p className={styles.geoHint} role="status">
            無法定位。可改選縣市，或稍後再開啟定位。
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
                <div className={styles.cityGrid} role="group" aria-labelledby={labelId}>
                  {region.cities.map((item) => (
                    <button
                      key={item.city}
                      type="button"
                      className={styles.city}
                      data-city={item.city}
                      data-status={item.status}
                      aria-pressed={item.city === selectedCity}
                      aria-label={item.ariaLabel}
                      onClick={() => onSelectCity(item.city)}
                    >
                      <span>{item.city}</span>
                      <span className={styles.cityCount}>{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {notice ? <p className={styles.notice}>{notice}</p> : null}
      </div>
    </div>,
    document.body,
  );
}
