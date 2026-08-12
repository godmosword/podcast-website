"use client";

import { VIEW_TABS, type PlayMapToolbarProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

export function PlayMapToolbar({
  coverageLabel,
  browseView,
  onSelectView,
  onTabKeyDown,
}: PlayMapToolbarProps) {
  return (
    <header className={styles.toolbar}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>親子遊樂地圖</h1>
        <p className={styles.coverage}>{coverageLabel}</p>
      </div>

      <div
        className={styles.viewTabs}
        role="tablist"
        aria-label="瀏覽方式"
        onKeyDown={onTabKeyDown}
      >
        {VIEW_TABS.map((tab) => {
          const active = browseView === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              role="tab"
              id={tab.id}
              data-view-tab={tab.view}
              aria-selected={active}
              aria-controls={tab.panelId}
              tabIndex={active ? 0 : -1}
              className={[styles.viewTab, active ? styles.viewTabActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectView(tab.view)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
