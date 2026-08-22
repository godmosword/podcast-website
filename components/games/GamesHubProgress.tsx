"use client";

import { useEffect, useState } from "react";
import { listColoringDrafts } from "@/lib/coloring/draft-storage";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { GAMEKIT_PROGRESS_EVENT } from "@/lib/gamekit/progress/session";
import {
  emptyHubSnapshot,
  hubProgressFromProfile,
  hubProgressLabel,
  type HubProgressSnapshot,
} from "@/lib/games/hub-progress";
import styles from "./GamesHubProgress.module.css";

/** Hub 低壓進度：星星句＋車庫五格＋貼紙。無進度也要能渲染。 */
export default function GamesHubProgress() {
  const [snap, setSnap] = useState<HubProgressSnapshot>(emptyHubSnapshot);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void listColoringDrafts()
        .then((drafts) => {
          if (cancelled) return;
          setSnap(
            hubProgressFromProfile(loadPlayerProfile(), drafts.length > 0),
          );
        })
        .catch(() => {
          if (cancelled) return;
          setSnap(emptyHubSnapshot());
        });
    };
    refresh();
    window.addEventListener(GAMEKIT_PROGRESS_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(GAMEKIT_PROGRESS_EVENT, refresh);
    };
  }, []);

  return (
    <div className={styles.wrap} aria-label="車庫與貼紙">
      <p className={styles.progress} aria-live="polite">
        {hubProgressLabel(snap)}
      </p>
      <ul className={styles.garage} aria-label="車庫">
        {snap.vehicles.map((vehicle) => (
          <li key={vehicle.id}>
            <span
              className={vehicle.unlocked ? styles.vehicleOn : styles.vehicleOff}
              role="img"
              aria-label={
                vehicle.unlocked
                  ? `認識${vehicle.name}`
                  : `還差 ${vehicle.remaining} 顆星星就能認識${vehicle.name}`
              }
            >
              <span aria-hidden>{vehicle.emoji}</span>
            </span>
          </li>
        ))}
      </ul>
      {snap.stickerLabels.length > 0 ? (
        <ul className={styles.stickers} aria-label="貼紙">
          {snap.stickerLabels.map((label) => (
            <li key={label} className={styles.sticker}>
              {label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
