"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HeroParallax from "../hero-parallax/HeroParallax";
import Icon from "@/components/ui/Icon";
import styles from "./HeroWorld.module.css";
import { EXIT_TRANSITION_MS, TRANSITION_RESET_MS, markEnterIntent, resolveEnterAction } from "./enter-transition";
import { dismissIntroGate } from "@/lib/intro-gate";

export type HeroWorldMode = "page" | "overlay";

/**
 * `page` 是 `/intro` 獨立頁；`overlay` 是首頁上的同頁覆蓋層（ADR-0004）。
 * 兩者共用同一份場景與生命周期，差別只在標題階層與出口語意：覆蓋層已經在
 * `/` 上，所以出口是按鈕與 `onDismiss`，不是連結與導航。
 *
 * 舞台只有橫向 2.5D 視差帶（docs/specs/HERO-PARALLAX-SPEC.md）。2026-10-26 Phase 3c
 * 拿掉了 R3F／Three 的等距 3D 舞台、模型與 `?stage=` 切換；`data-stage` 固定 `parallax`。
 */
export default function HeroWorld({ mode = "page", onDismiss }: { mode?: HeroWorldMode; onDismiss?: () => void } = {}) {
  const overlay = mode === "overlay";
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const navigating = useRef(false);
  // 按下進入的當下就停掉視差動畫，把主執行緒完整讓給路由切換。
  const [exited, setExited] = useState(false);
  const transitionResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (transitionResetTimer.current) clearTimeout(transitionResetTimer.current);
  }, []);
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [ready, setReady] = useState(false);

  // 視差帶沒有 WebGL 可以失敗、沒有模型可以下載：reduced motion 由 CSS 直接退成靜態圖
  // （規格 §4.5）。這裡只追蹤「看得到」：離開視窗或切到背景分頁就凍住。
  useEffect(() => {
    setVisible(true);
    const visibility = () => setPageVisible(!document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true), { threshold: .05 })
      : null;
    if (observer && root.current) observer.observe(root.current);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  const active = visible && pageVisible && !exited;
  const enter = (event: React.MouseEvent<HTMLElement>) => {
    const action = resolveEnterAction({
      button: event.button, metaKey: event.metaKey, ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey, altKey: event.altKey,
      ready, eligible: true, failed: false,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      navigating: navigating.current,
      mode,
    });
    // 修飾鍵／中鍵：原生 `<a href="/?enter=1">` 語意原封不動（新分頁、新視窗、
    // 複製連結），這個分頁不做任何事，也不留下進站意圖。
    if (action === "native") return;
    event.preventDefault();
    // 第二次觸發（雙擊、鍵盤重複）只被吃掉，不會產生第二次導航。
    if (action === "ignore") return;
    navigating.current = true;
    // 兩條路徑都立刻停止視差動畫；差別只在有沒有那層 ≤360ms 的淡出。
    setExited(true);
    if (action === "transition") setEntering(true);
    if (overlay) {
      // 覆蓋層沒有導航可以等：淡出跑完就把它拿掉，露出底下本來就在的 Landing。
      transitionResetTimer.current = setTimeout(() => {
        transitionResetTimer.current = null;
        onDismiss?.();
      }, action === "transition" ? EXIT_TRANSITION_MS : 0);
      return;
    }
    markEnterIntent();
    // 從 `/intro` 進站的人已經看過開場了，先記下來，否則回到 `/` 會再被首頁的
    // 覆蓋層蓋一次（ADR-0004）。
    dismissIntroGate();
    // 導航立刻開始。淡出與相機推近是**同時**發生的裝飾，不是導航的前置條件，
    // 所以慢裝置或提早就緒的路由都不會被動畫拖住。
    router.replace("/");
    // route chunk 失敗時把原生連結還給使用者，不留住不透明的覆蓋層。
    transitionResetTimer.current = setTimeout(() => {
      transitionResetTimer.current = null;
      navigating.current = false;
      setEntering(false);
      setExited(false);
    }, TRANSITION_RESET_MS);
  };
  return (
      <section ref={root} className={styles.hero}
      {...(overlay ? { "aria-label": "車車遊樂園開場" } : { "aria-labelledby": "intro-title" })} data-hero-world
      data-hero-mode={overlay ? "overlay" : "page"}
      style={{ "--exit-transition-ms": `${EXIT_TRANSITION_MS}ms` } as React.CSSProperties}
      data-stage="parallax"
      data-scene-state={ready ? "ready" : "poster"}
      data-scene-active={(visible || ready) && active} data-entering={entering}>
      <div className={styles.content} data-hero-content>
      <div className={styles.copy}>
        {/* 首頁已經有自己的 h1，覆蓋層不能再開一個第二層級標題。 */}
        {overlay
          ? <p className={styles.title}>車車遊樂園</p>
          : <h1 id="intro-title" className={styles.title}>車車遊樂園</h1>}
        <p className={styles.description}>故事，就從這裡出發。</p>
      </div>
      <div className={styles.actions}>
        {overlay
          ? <button type="button" className={styles.cta} data-intro-dismiss onClick={enter}>進入車車遊樂園<Icon name="arrow-right" size={18} className={styles.ctaIcon} /></button>
          : <Link href="/?enter=1" replace className={styles.cta} onClick={enter}>進入車車遊樂園<Icon name="arrow-right" size={18} className={styles.ctaIcon} /></Link>}
      </div>
      </div>
      <HeroParallax running={active} deferImages={overlay} onReady={() => setReady(true)} />
      {/* href 維持 `/?enter=1`：那是無 JS 與深連結的語意入口。JS 可用時兩個連結
          都改由 router 送到乾淨的 `/`，canonical 不變。覆蓋層已經在 `/` 上，
          所以那裡的出口是按鈕。 */}
      {overlay
        ? <button type="button" className={styles.skip} data-intro-dismiss onClick={enter}>略過動畫</button>
        : <Link href="/?enter=1" replace className={styles.skip} onClick={enter}>略過動畫</Link>}
    </section>
  );
}
