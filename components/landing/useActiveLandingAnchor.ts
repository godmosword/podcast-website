"use client";

import { useEffect, useState } from "react";
import { activeLandingAnchor } from "@/lib/landing-scroll";
import { useLandingScroll } from "./LandingScrollContext";

/**
 * 首頁目前停在哪一段（中段帶子裡露出最多的那段）；掛載前與都碰不到時回 null。
 * 聽捲動區的 scroll，每個畫格最多算一次。不用 IntersectionObserver：它只在掛載時
 * 抓一次段落節點，段落在串流／hydration 時被換掉就再也不回報（2026-10-25）。
 */
export function useActiveLandingAnchor(
  anchorIds: readonly string[],
): string | null {
  const landingScroll = useLandingScroll();
  const [active, setActive] = useState<string | null>(null);
  const idsKey = anchorIds.join("\n");

  useEffect(() => {
    const root = landingScroll?.scrollRootRef.current ?? null;
    const ids = idsKey.split("\n");
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = activeLandingAnchor(root, ids);
      if (next) setActive(next);
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    const scroller: EventTarget = root ?? window;
    scroller.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [landingScroll, idsKey]);

  return active;
}
