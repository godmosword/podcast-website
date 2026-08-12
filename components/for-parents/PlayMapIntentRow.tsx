"use client";

import type { PlayMapIntentRowProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

export function PlayMapIntentRow({
  nearMeActive,
  geoStatus,
  freeOnly,
  indoorOnly,
  onNearMe,
  onToggleFree,
  onToggleIndoor,
}: PlayMapIntentRowProps) {
  return (
    <section className={styles.intentSection} aria-label="快速意圖">
      <p className={styles.intentLead}>今天想去哪？</p>
      <div className={styles.intentGrid} role="group" aria-label="意圖快捷">
        <button
          type="button"
          className={styles.intentChip}
          aria-pressed={nearMeActive}
          aria-busy={geoStatus === "pending"}
          onClick={onNearMe}
        >
          離我最近
        </button>
        <button
          type="button"
          className={styles.intentChip}
          aria-pressed={freeOnly}
          onClick={onToggleFree}
        >
          免費放電
        </button>
        <button
          type="button"
          className={styles.intentChip}
          aria-pressed={indoorOnly}
          onClick={onToggleIndoor}
        >
          室內
        </button>
      </div>
      {geoStatus === "denied" ? (
        <p className={styles.geoHint} role="status">
          無法定位，已改為免費優先。
        </p>
      ) : null}
      {geoStatus === "pending" ? (
        <p className={styles.geoHint} role="status">
          正在取得位置…
        </p>
      ) : null}
    </section>
  );
}
