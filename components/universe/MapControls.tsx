"use client";

import styles from "./MapControls.module.css";

type MapControlsProps = {
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
};

export default function MapControls({
  onReset,
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
}: MapControlsProps) {
  return (
    <div className={styles.controls} role="group" aria-label="地圖控制">
      {/* 回樂園：帶文字的自救鈕（T4）——羅盤／房子 icon 對幼兒太抽象，
          文字＋房子並列；迷路自動回中（UniverseMap）之外的手動出口。 */}
      <button
        type="button"
        className={`${styles.btn} ${styles.homeBtn}`}
        onClick={onReset}
        aria-label="回樂園（置中車車樂園）"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M3 11.5 12 4l9 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 10.5V20h13v-9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 20v-5h4v5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.homeLabel}>回樂園</span>
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={onZoomIn}
        aria-label="放大地圖（右下角加號）"
        disabled={!canZoomIn}
      >
        ＋
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={onZoomOut}
        aria-label="縮小地圖（右下角減號）"
        disabled={!canZoomOut}
      >
        －
      </button>
    </div>
  );
}
