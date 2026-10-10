"use client";

import Icon from "@/components/ui/Icon";
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
        <Icon name="home" size={20} />
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
