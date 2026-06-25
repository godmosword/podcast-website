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
    const el = document.getElementById(anchorId);
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
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
      <div ref={scrollRef} className={className}>
        {children}
      </div>
    </LandingScrollContext.Provider>
  );
}
