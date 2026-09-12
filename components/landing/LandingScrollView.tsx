"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { scrollLandingToAnchor } from "@/lib/landing-scroll";
import { LandingScrollContext } from "./LandingScrollContext";

type LandingScrollViewProps = {
  children: ReactNode;
  className?: string;
};

/** Landing 專用捲動容器：一次對齊一個主題段，避免整頁 snap 彈回。 */
export default function LandingScrollView({
  children,
  className,
}: LandingScrollViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToSegment = useCallback((anchorId: string) => {
    scrollLandingToAnchor(anchorId);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const id = window.requestAnimationFrame(() => scrollToSegment(hash));
    return () => window.cancelAnimationFrame(id);
  }, [scrollToSegment]);

  return (
    <LandingScrollContext.Provider
      value={{
        scrollRootRef: scrollRef as RefObject<HTMLDivElement | null>,
        scrollToSegment,
      }}
    >
      {/* 首頁鎖定文件捲動，改由此容器負責 snap；tabIndex 讓鍵盤使用者
          可聚焦並用方向鍵/PageUp-Down 捲動。各段中央 moreSkip 淡雙折線
          也可點換段（最後一段捲回第一屏），不佔 CTA／嘟嘟底列。 */}
      <div
        ref={scrollRef}
        className={className}
        tabIndex={0}
        role="region"
        aria-label="主題專區，可用方向鍵捲動瀏覽"
        data-landing-scroll=""
      >
        {children}
      </div>
    </LandingScrollContext.Provider>
  );
}
