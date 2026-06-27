"use client";

import styles from "./MapControls.module.css";

type MapControlsProps = {
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export default function MapControls({
  onReset,
  onZoomIn,
  onZoomOut,
}: MapControlsProps) {
  return (
    <div className={styles.controls} role="group" aria-label="地圖控制">
      <button
        type="button"
        className={styles.btn}
        onClick={onReset}
        aria-label="回大門（置中車車樂園）"
      >
        🏠
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={onZoomIn}
        aria-label="放大地圖"
      >
        ＋
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={onZoomOut}
        aria-label="縮小地圖"
      >
        －
      </button>
    </div>
  );
}
