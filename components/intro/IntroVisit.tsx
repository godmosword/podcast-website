"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export const INTRO_VISIT_KEY = "cheche-intro-visited-v1";

type IntroVisitDecision = {
  pathname: string;
  search: string;
  hash: string;
  seen: boolean;
  online: boolean;
  historyRestored: boolean;
};

/**
 * The invitation is deliberately a small, pure policy decision. Keeping it
 * outside the effect makes the redirect contract testable without importing
 * Next's router or a WebGL bundle.
 */
export function shouldInviteToIntro({
  pathname,
  search,
  hash,
  seen,
  online,
  historyRestored,
}: IntroVisitDecision): boolean {
  if (pathname !== "/" || seen || !online || historyRestored) return false;
  if (hash) return false;
  return new URLSearchParams(search).get("enter") !== "1";
}

function markIntroVisited(): void {
  sessionStorage.setItem(INTRO_VISIT_KEY, "1");
}

function isHistoryRestored(): boolean {
  try {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return entry?.type === "back_forward";
  } catch {
    return false;
  }
}

/** A per-tab invitation, never a server redirect or a deep-link gate. */
export default function IntroVisit() {
  const pathname = usePathname();
  const router = useRouter();
  const redirected = useRef(false);

  // A BFCache restore must never replay the invitation or reset the page's
  // scroll position. The performance entry covers normal history restores;
  // pageshow covers Safari's persisted page path.
  const restored = useRef(false);
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) restored.current = true;
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(INTRO_VISIT_KEY) === "1";
      // A directly opened /intro should count as having seen the invitation,
      // so Back to / does not unexpectedly show it again.
      if (pathname === "/intro") {
        markIntroVisited();
        return;
      }
      markIntroVisited();
      const invite = shouldInviteToIntro({
        pathname,
        search: location.search,
        hash: location.hash,
        seen,
        online: navigator.onLine,
        historyRestored: restored.current || isHistoryRestored(),
      });
      if (invite && !redirected.current) {
        redirected.current = true;
        router.replace("/intro");
      } else if (pathname === "/" && location.search && new URLSearchParams(location.search).get("enter") === "1") {
        document.getElementById("main-content")?.focus({ preventScroll: true });
      }
    } catch {
      // Storage denied: keep the content site directly usable, without a redirect loop.
    }
  }, [pathname, router]);
  return null;
}
