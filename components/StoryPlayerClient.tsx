"use client";

import dynamic from "next/dynamic";
import type { StoryPlayerProps } from "./StoryPlayer";
import styles from "./StoryPlayer.module.css";

// 播放器是全站最大的互動元件，且只用於 noindex 的播放頁。
// 以 ssr:false 動態載入，讓播放頁初始 JS 更輕、互動更快，載入期間顯示骨架。
const StoryPlayer = dynamic(() => import("./StoryPlayer"), {
  ssr: false,
  loading: () => (
    <div className={styles.player} aria-busy="true" aria-label="載入播放器中">
      <div className={styles.stage} />
    </div>
  ),
});

export default function StoryPlayerClient(props: StoryPlayerProps) {
  return <StoryPlayer {...props} />;
}
