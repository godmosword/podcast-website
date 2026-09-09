"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HeroWorld from "@/components/landing/hero-world/HeroWorld";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { dismissIntroGate, isIntroGateOpen } from "@/lib/intro-gate";
import styles from "./IntroOverlay.module.css";

/**
 * 首頁的 3D 開場覆蓋層（ADR-0004）。
 *
 * 刻意**不用** `next/dynamic ssr:false`：它必須出現在 `/` 的 SSR HTML 裡。
 * 若改成「掛載後才顯示」，就會出現 ADR-0003 量到的那種閃爍的鏡像版——
 * 先看到 Landing，再被 3D 蓋上去。要不要顯示由 `<head>` 的同步 script 在
 * 首次繪製前決定（`html[data-intro-gate="on"]`），CSS 預設是隱藏。
 *
 * 底下的 Landing 是完整的 HTML，覆蓋層只是視覺與焦點層：`inert` 由 `<main>`
 * 之後的同步 script 先設好，這裡只負責關閉時收拾。
 */
export default function IntroOverlay() {
  const container = useRef<HTMLDivElement>(null);
  // SSR 與首次繪製都當作「開著」——真正的顯隱是 CSS 依 <html> 屬性決定，
  // React 只在 hydration 後接手，所以這裡的初值不會造成任何閃爍。
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(isIntroGateOpen());
  }, []);

  const dismiss = useCallback(() => {
    dismissIntroGate();
    setOpen(false);
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, []);

  useFocusTrap(open, container, { initialFocus: "container" });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      ref={container}
      className={styles.overlay}
      data-intro-overlay
      role="dialog"
      aria-modal="true"
      aria-label="車車遊樂園開場"
      tabIndex={-1}
    >
      <HeroWorld mode="overlay" onDismiss={dismiss} />
    </div>
  );
}
