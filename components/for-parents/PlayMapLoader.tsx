"use client";

import dynamic from "next/dynamic";
import styles from "./PlayMap.module.css";

const PlayMap = dynamic(() => import("./PlayMap"), {
  ssr: false,
  loading: () => (
    <div className={styles.mapLoading} role="status" aria-live="polite">
      地圖載入中…
    </div>
  ),
});

export default function PlayMapLoader() {
  return <PlayMap />;
}
