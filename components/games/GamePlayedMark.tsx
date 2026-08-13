"use client";

import { useEffect, useState } from "react";
import { listColoringDrafts } from "@/lib/coloring/draft-storage";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { GAMEKIT_PROGRESS_EVENT } from "@/lib/gamekit/progress/session";
import styles from "./GamePlayedMark.module.css";

type GamePlayedMarkProps = {
  slug: string;
};

/** 卡片上的「玩過」小點；著色本看本機草稿。 */
export default function GamePlayedMark({ slug }: GamePlayedMarkProps) {
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (slug === "coloring-book") {
        void listColoringDrafts().then((drafts) => {
          if (!cancelled) setPlayed(drafts.length > 0);
        });
        return;
      }
      const profile = loadPlayerProfile();
      const flag =
        slug === "candy-match"
          ? Boolean(profile.gamesPlayed["candy-match"])
          : slug === "block-drop"
            ? Boolean(profile.gamesPlayed["block-drop"])
            : false;
      setPlayed(flag);
    };
    refresh();
    window.addEventListener(GAMEKIT_PROGRESS_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(GAMEKIT_PROGRESS_EVENT, refresh);
    };
  }, [slug]);

  if (!played) return null;
  return (
    <span className={styles.mark} aria-label="玩過">
      玩過
    </span>
  );
}
