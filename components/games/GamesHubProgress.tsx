"use client";

import { useEffect, useState } from "react";
import { listColoringDrafts } from "@/lib/coloring/draft-storage";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { GAMEKIT_PROGRESS_EVENT } from "@/lib/gamekit/progress/session";
import {
  hubProgressFromProfile,
  hubProgressLabel,
  type HubProgressSnapshot,
} from "@/lib/games/hub-progress";
import styles from "./GamesHubProgress.module.css";

function emptySnap(): HubProgressSnapshot {
  return hubProgressFromProfile(loadPlayerProfile(), false);
}

/** Hub 低壓進度條：星星／已玩／下一輛車庫車。無進度也要能渲染。 */
export default function GamesHubProgress() {
  const [label, setLabel] = useState("收集了 0 顆星星");

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void listColoringDrafts()
        .then((drafts) => {
          if (cancelled) return;
          const snap = hubProgressFromProfile(
            loadPlayerProfile(),
            drafts.length > 0,
          );
          setLabel(hubProgressLabel(snap));
        })
        .catch(() => {
          if (cancelled) return;
          setLabel(hubProgressLabel(emptySnap()));
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
    <p className={styles.progress} aria-live="polite">
      {label}
    </p>
  );
}
