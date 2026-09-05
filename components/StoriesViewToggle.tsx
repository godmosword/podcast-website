"use client";

import { useEffect, useState } from "react";
import { playSfx } from "@/lib/sfx";
import {
  applyStoriesView,
  readStoriesViewFromDocument,
  STORIES_VIEW_GRID_LABEL,
  STORIES_VIEW_LIST_LABEL,
  STORIES_VIEW_TOGGLE_LABEL,
  type StoriesView,
} from "@/lib/stories-view";
import styles from "./StoriesViewToggle.module.css";

const OPTIONS: readonly { view: StoriesView; label: string }[] = [
  { view: "grid", label: STORIES_VIEW_GRID_LABEL },
  { view: "list", label: STORIES_VIEW_LIST_LABEL },
];

export default function StoriesViewToggle() {
  const [view, setView] = useState<StoriesView>("grid");

  useEffect(() => {
    setView(readStoriesViewFromDocument());
  }, []);

  function select(next: StoriesView) {
    if (next === view) return;
    playSfx("tap");
    applyStoriesView(next);
    setView(next);
  }

  return (
    <div className={styles.wrap} role="group" aria-label={STORIES_VIEW_TOGGLE_LABEL}>
      {OPTIONS.map((option) => {
        const active = view === option.view;
        return (
          <button
            key={option.view}
            type="button"
            className={`${styles.segment} ${active ? styles.segmentActive : ""}`}
            onClick={() => select(option.view)}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
