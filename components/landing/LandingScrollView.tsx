"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
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
    const root = scrollRef.current;
    const el = document.getElementById(anchorId);
    if (!root || !el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const targetTop =
      el.getBoundingClientRect().top -
      root.getBoundingClientRect().top +
      root.scrollTop;
    root.scrollTo({
      top: targetTop,
      behavior: reduced ? "auto" : "smooth",
    });
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
          可聚焦並用方向鍵/PageUp-Down 捲動，作為 SegmentNav 之外的退路。 */}
      <div
        ref={scrollRef}
        className={className}
        tabIndex={0}
        role="region"
        aria-label="主題專區，可用方向鍵捲動瀏覽"
      >
        {children}
      </div>
    </LandingScrollContext.Provider>
  );
}
