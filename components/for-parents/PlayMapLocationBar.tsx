"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Icon from "@/components/ui/Icon";
import {
  FILTER_PANEL_ID,
  LOCATION_DIALOG_ID,
  type PlayMapLocationBarProps,
} from "./PlayMapContract";
import styles from "./PlayMapLocationBar.module.css";

/**
 * 位置列碰到黏住線時切 data-stuck。
 * sentinel 是貼在位置列上緣外 1px 的絕對定位元素（不佔版面、跟著位置列移動），
 * 它越過黏住線＝位置列已黏住。黏住線＝位置列 computed `top`
 * （--nav-h 依斷點與安全區不同，直接量最準）；沒有 IntersectionObserver（jsdom、舊瀏覽器）
 * 就維持展開版。
 */
function useStuck(
  sentinelRef: RefObject<HTMLElement | null>,
  barRef: RefObject<HTMLElement | null>,
): boolean {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const bar = barRef.current;
    if (!sentinel || !bar || !("IntersectionObserver" in window)) return;

    let observer: IntersectionObserver | null = null;
    const observe = () => {
      observer?.disconnect();
      const stickTop = Math.ceil(parseFloat(getComputedStyle(bar).top) || 0);
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          const rootTop = entry.rootBounds?.top ?? stickTop;
          setStuck(
            !entry.isIntersecting && entry.boundingClientRect.top < rootTop,
          );
        },
        // +2：sentinel 剛好貼在黏住線上時，IO 會把「邊緣相接」算成相交；多讓 1px 才判定為已黏住。
        { rootMargin: `-${stickTop + 2}px 0px 0px 0px`, threshold: 0 },
      );
      observer.observe(sentinel);
    };

    observe();
    window.addEventListener("resize", observe);
    return () => {
      window.removeEventListener("resize", observe);
      observer?.disconnect();
    };
  }, [barRef, sentinelRef]);

  return stuck;
}

/**
 * 位置列：「在［全台 ▾］或［我附近］」＋「更多條件」。
 * 捲過之後黏在導覽列下方，縮成一列：［台北市 ▾］［下雨也能玩 ✕］［更多條件 n］。
 * 「更多條件」面板當 children 放進同一個黏住容器，展開時不會被捲走。
 */
export function PlayMapLocationBar({
  locationLabel,
  locationTriggerRef,
  onOpenLocation,
  locationOpen,
  nearMeActive,
  geoStatus,
  onNearMe,
  panelFilterCount,
  filtersOpen,
  onToggleFilters,
  activeScenarioLabel,
  onClearActiveScenario,
  children,
}: PlayMapLocationBarProps) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const stuck = useStuck(sentinelRef, barRef);

  return (
    <div
      ref={barRef}
      className={styles.bar}
      data-stuck={stuck ? "true" : "false"}
      data-location-bar
    >
      <span ref={sentinelRef} className={styles.sentinel} aria-hidden />
      <div className={styles.row} role="group" aria-label="地點與更多條件">
        <span className={styles.word}>在</span>
        <button
          ref={locationTriggerRef}
          type="button"
          className={styles.trigger}
          aria-haspopup="dialog"
          aria-expanded={locationOpen}
          aria-controls={locationOpen ? LOCATION_DIALOG_ID : undefined}
          aria-label={`選擇地點，目前：${locationLabel}`}
          onClick={onOpenLocation}
        >
          <Icon name="map-pin" size={16} />
          <span className={styles.triggerLabel}>{locationLabel}</span>
          <Icon name="chevron-down" size={16} />
        </button>
        <span className={styles.word}>或</span>
        <button
          type="button"
          className={styles.nearMe}
          aria-pressed={nearMeActive}
          aria-busy={geoStatus === "pending"}
          data-quick-filter="nearby"
          onClick={onNearMe}
        >
          {nearMeActive ? <Icon name="check" size={14} /> : null}
          我附近
        </button>
        {activeScenarioLabel ? (
          <button
            type="button"
            className={styles.scenarioChip}
            aria-label={`取消「${activeScenarioLabel}」`}
            onClick={onClearActiveScenario}
          >
            {activeScenarioLabel}
            <Icon name="close" size={14} />
          </button>
        ) : null}
        <button
          type="button"
          className={styles.moreToggle}
          aria-expanded={filtersOpen}
          aria-controls={FILTER_PANEL_ID}
          aria-label={`更多條件${panelFilterCount > 0 ? `，已套用 ${panelFilterCount} 個` : ""}`}
          onClick={onToggleFilters}
        >
          <Icon name="sliders" size={16} />
          <span className={styles.moreLabel}>更多條件</span>
          {panelFilterCount > 0 ? (
            <span className={styles.moreCount} aria-hidden>
              {panelFilterCount}
            </span>
          ) : null}
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

      {children}
    </div>
  );
}
