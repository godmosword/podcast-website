"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [adoptLandingPlayback, setAdoptLandingPlayback] = useState<
    boolean | null
  >(props.adoptLandingPlayback ?? null);

  // Next can prefetch this client component while the browser is still on the
  // landing page. Resolve the query after navigation, and rerun when the
  // pathname changes, so the prefetch does not cache a false autoplay flag.
  useEffect(() => {
    if (props.adoptLandingPlayback !== undefined) {
      setAdoptLandingPlayback(props.adoptLandingPlayback);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setAdoptLandingPlayback(
      pathname?.endsWith("/play") === true &&
        params.get("autoplay") === "1" &&
        params.get("from") === "landing",
    );
  }, [pathname, props.adoptLandingPlayback]);

  if (adoptLandingPlayback === null) {
    return (
      <div className={styles.player} aria-busy="true" aria-label="載入播放器中">
        <div className={styles.stage} />
      </div>
    );
  }

  return <StoryPlayer {...props} adoptLandingPlayback={adoptLandingPlayback} />;
}
