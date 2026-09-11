"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import HeroWorld from "@/components/landing/hero-world/HeroWorld";
import {
  dismissIntroGate,
  INTRO_GATE_ATTRIBUTE,
  isIntroGateOpen,
  sealIntroBackground,
} from "@/lib/intro-gate";
import styles from "./IntroOverlay.module.css";

/**
 * 首頁的 3D 開場覆蓋層（ADR-0004）。
 *
 * 刻意**不用** `next/dynamic ssr:false`：它必須出現在 `/` 的 SSR HTML 裡。
 * 若改成「掛載後才顯示」，就會出現 ADR-0003 量到的那種閃爍的鏡像版——
 * 先看到 Landing，再被 3D 蓋上去。要不要顯示由 `<head>` 的同步 script 在
 * 首次繪製前決定（`html[data-intro-gate="on"]`），CSS 預設是隱藏。
 *
 * 底下的 Landing 是完整的 HTML，覆蓋層只是視覺層：`inert` 由 `<main>`
 * 之後的同步 script 先設好（頂欄不封），這裡只負責關閉時收拾。
 * 不設焦點陷阱——開場期間頂欄訂閱／留言／漢堡要能 Tab 進去。
 */
export default function IntroOverlay() {
  const container = useRef<HTMLDivElement>(null);
  // SSR 與首次繪製都當作「開著」——真正的顯隱是 CSS 依 <html> 屬性決定，
  // React 只在 hydration 後接手，所以這裡的初值不會造成任何閃爍。
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const sync = () => setOpen(isIntroGateOpen());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [INTRO_GATE_ATTRIBUTE],
    });
    return () => observer.disconnect();
  }, []);

  const dismiss = useCallback(() => {
    dismissIntroGate();
    setOpen(false);
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, []);

  useLayoutEffect(() => {
    if (!open || !isIntroGateOpen()) return;
    // 重開時覆蓋層才剛掛回 DOM；inert script 的 seal 在當時找不到 overlay。
    sealIntroBackground();
    container.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  useEffect(() => {
    return () => {
      // Strict Mode 假卸載時仍在 `/`，不要把閘門關了。
      // 從頂欄走到別頁才清屬性，否則 skip-link 會一直 inert。
      if (typeof window !== "undefined" && window.location.pathname !== "/" && isIntroGateOpen()) {
        dismissIntroGate();
      }
    };
  }, []);

  if (!open) return null;

  return (
    <div
      ref={container}
      className={styles.overlay}
      data-intro-overlay
      role="dialog"
      aria-modal="false"
      aria-label="車車遊樂園開場"
      tabIndex={-1}
    >
      <HeroWorld mode="overlay" onDismiss={dismiss} />
    </div>
  );
}
