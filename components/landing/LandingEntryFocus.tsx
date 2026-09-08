"use client";

import { useEffect } from "react";
import {
  consumeEnterIntent,
  hasHandledEntryFocus,
  markEntryFocusHandled,
  shouldFocusLandingMain,
} from "@/components/landing/hero-world/enter-transition";

function navigationType(): string {
  try {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return entry?.type ?? "";
  } catch {
    return "";
  }
}

/**
 * ADR-0003 拿掉自動邀請時，連帶移除了「從 Intro 進站後把 focus 交給 Landing」
 * 的行為（PLAN §9 要求）。這裡把它補回來，而且只在真的從 Intro 進來時才做：
 * 直接開 `/`、Back／Forward 還原都不搶焦點。
 */
export default function LandingEntryFocus() {
  useEffect(() => {
    if (!shouldFocusLandingMain({
      fromIntro: consumeEnterIntent(),
      search: window.location.search,
      navigationType: navigationType(),
      documentHandled: hasHandledEntryFocus(),
    })) return;
    markEntryFocusHandled();
    // preventScroll：Landing 有自己的捲動容器，搶焦點不能把畫面拉走。
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, []);
  return null;
}
