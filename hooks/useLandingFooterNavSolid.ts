"use client";

import { useEffect, useState } from "react";

/** 與 LandingHub footer snap pane 的 id 一致。 */
export const LANDING_FOOT_ELEMENT_ID = "landing-foot";

/** IntersectionObserver 門檻：footer 進入視窗比例達此值即視為需實心頂欄。 */
export const LANDING_FOOT_SOLID_RATIO = 0.12;

export type FooterIntersectionSnapshot = Pick<
  IntersectionObserverEntry,
  "isIntersecting" | "intersectionRatio"
>;

/** 純函式：供 vitest 與 observer callback 共用。 */
export function landingFooterWarrantsSolidNav(
  entry: FooterIntersectionSnapshot,
  ratioThreshold = LANDING_FOOT_SOLID_RATIO,
): boolean {
  return entry.isIntersecting && entry.intersectionRatio >= ratioThreshold;
}

/**
 * 首頁 landing：footer snap pane 進入視窗時拉高頂欄不透明度，避免白底頁尾文字透過毛玻璃。
 */
export function useLandingFooterNavSolid(enabled: boolean): boolean {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setSolid(false);
      return;
    }

    const target = document.getElementById(LANDING_FOOT_ELEMENT_ID);
    if (!target || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setSolid(landingFooterWarrantsSolidNav(entry));
      },
      {
        root: null,
        threshold: [0, 0.05, 0.12, 0.2, 0.35, 0.5],
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled]);

  return solid;
}
