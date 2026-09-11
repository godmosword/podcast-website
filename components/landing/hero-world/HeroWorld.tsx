"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { HERO_STAGE_DEFAULT, MODEL_PATH, chooseQuality, resolveHeroStage, type HeroStage, type MotionPhase, type Quality } from "./config";
import HeroParallax from "../hero-parallax/HeroParallax";
import styles from "./HeroWorld.module.css";
import { getActiveClock, LOAD_TIMEOUT_MS, MAX_TICK_DELTA_MS, SLEEP_AFTER_MS, TICK_MS } from "./active-clock";
import { EXIT_TRANSITION_MS, TRANSITION_RESET_MS, markEnterIntent, resolveEnterAction } from "./enter-transition";
import { dismissIntroGate } from "@/lib/intro-gate";

const Scene = dynamic(() => import("./HeroScene"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

/** Capability check is intentionally tiny and runs before the WebGL chunk. */
export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    // Software WebGL (for example headless Chromium) is still a valid
    // progressive enhancement; QualityManager can lower the tier later.
    const attributes = { failIfMajorPerformanceCaveat: false };
    return Boolean(
      canvas.getContext("webgl2", attributes) ||
      canvas.getContext("webgl", attributes) ||
      canvas.getContext("experimental-webgl", attributes),
    );
  } catch {
    return false;
  }
}

/**
 * 舞台選擇。SSR 與首次繪製用 build 預設，hydration 後才讀 `?stage=` 覆寫——
 * 這樣不會有 hydration 落差，代價是覆寫時舞台會在掛載後才切換，本機看效果可接受。
 */
function useHeroStage(): HeroStage {
  const [stage, setStage] = useState<HeroStage>(HERO_STAGE_DEFAULT);
  useEffect(() => {
    setStage(resolveHeroStage(window.location.search));
  }, []);
  return stage;
}

export type HeroWorldMode = "page" | "overlay";

/**
 * `page` 是 `/intro` 獨立頁；`overlay` 是首頁上的同頁覆蓋層（ADR-0004）。
 * 兩者共用同一份場景與生命周期，差別只在標題階層與出口語意：覆蓋層已經在
 * `/` 上，所以出口是按鈕與 `onDismiss`，不是連結與導航。
 */
export default function HeroWorld({ mode = "page", onDismiss }: { mode?: HeroWorldMode; onDismiss?: () => void } = {}) {
  const overlay = mode === "overlay";
  const stage = useHeroStage();
  const parallax = stage === "parallax";
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const navigating = useRef(false);
  // 按下進入的當下就停止算繪，把主執行緒完整讓給路由切換。實測（軟體算圖的
  // 容器）：讓場景繼續畫，網址要 1.3 秒才換；停掉之後 80ms。推近改由 CSS
  // transform 做，所以停算繪不會犧牲視覺。
  const [exited, setExited] = useState(false);
  const transitionResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (transitionResetTimer.current) clearTimeout(transitionResetTimer.current);
  }, []);
  const root = useRef<HTMLElement>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [quality, setQuality] = useState<Quality>("medium");
  const [paused, setPaused] = useState(false);
  // 視差舞台專用：reduced motion 下沒有動態可暫停，暫停鈕要跟著消失。
  // 3D 舞台不用這個——它在 reduced motion 下根本不會 ready。
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState<MotionPhase>("approach");
  const loadActiveMs = useRef(0);
  const sleepActiveMs = useRef(0);
  const autoPaused = useRef(false);

  const fail = useCallback(() => setFailed(true), []);

  // Let the wheel breathe briefly after 24 seconds of active, foreground time;
  // wall-clock time spent hidden or paused must not consume the motion budget.
  useEffect(() => {
    if (!ready) {
      sleepActiveMs.current = 0;
      autoPaused.current = false;
      return;
    }
    if (autoPaused.current || !visible || !pageVisible || paused) return;
    const clock = getActiveClock();
    let previous = clock.now();
    const timer = clock.setInterval(() => {
      const now = clock.now();
      sleepActiveMs.current += Math.min(Math.max(now - previous, 0), MAX_TICK_DELTA_MS);
      previous = now;
      if (sleepActiveMs.current >= SLEEP_AFTER_MS) {
        autoPaused.current = true;
        setPaused(true);
      }
    }, TICK_MS);
    return () => clock.clearInterval(timer);
  }, [ready, visible, pageVisible, paused]);


  useEffect(() => {
    // 視差帶沒有 WebGL 可以失敗、沒有模型可以下載：reduced motion 由 CSS 直接
    // 退成靜態圖（規格 §4.5），所以整套資格判定都不適用，直接視為可用。
    if (parallax) {
      setEligible(true);
      setFailed(false);
      setVisible(true);
      const motion = matchMedia("(prefers-reduced-motion: reduce)");
      const syncMotion = () => setReducedMotion(motion.matches);
      syncMotion();
      motion.addEventListener("change", syncMotion);
      const visibility = () => setPageVisible(!document.hidden);
      visibility();
      document.addEventListener("visibilitychange", visibility);
      const observer = "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true), { threshold: .05 })
        : null;
      if (observer && root.current) observer.observe(root.current);
      return () => {
        observer?.disconnect();
        motion.removeEventListener("change", syncMotion);
        document.removeEventListener("visibilitychange", visibility);
      };
    }
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: Connection };
    const connection = nav.connection;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      if (timer) clearTimeout(timer);
      const allowed = process.env.NEXT_PUBLIC_HERO_3D !== "0" && !motion.matches &&
        navigator.onLine && !connection?.saveData && !/^(slow-)?2g$/.test(connection?.effectiveType ?? "");
      if (!allowed) { setEligible(false); setReady(false); return; }
      if (!canUseWebGL()) {
        setEligible(false); setReady(false); setFailed(true);
        return;
      }
      // 留出首屏 HTML／圖片繪製時間，進入視窗後才下載 WebGL 程式。
      timer = setTimeout(() => {
        setQuality(chooseQuality(nav.hardwareConcurrency || 4, nav.deviceMemory ?? 8, matchMedia("(max-width: 768px)").matches));
        setEligible(true);
      }, 900);
    };
    const visibility = () => setPageVisible(!document.hidden);
    const online = () => update();
    update(); visibility();
    motion.addEventListener("change", update);
    connection?.addEventListener("change", update);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    document.addEventListener("visibilitychange", visibility);
    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true), { threshold: .05 })
      : null;
    if (observer && root.current) observer.observe(root.current);
    else setVisible(true);
    return () => {
      if (timer) clearTimeout(timer);
      observer?.disconnect(); motion.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [parallax]);

  // 上限避免慢速／卡住的模型讓空白 canvas 長期蓋住備用圖。只累計
  // active time；切到背景分頁時不把瀏覽器的 wall-clock 暫停算進來。
  useEffect(() => {
    if (!eligible || ready || failed) {
      loadActiveMs.current = 0;
      return;
    }
  }, [eligible, ready, failed]);

  useEffect(() => {
    if (parallax || !eligible || !visible || ready || failed) return;
    const clock = getActiveClock();
    let previous = clock.now();
    const timeout = clock.setInterval(() => {
      const now = clock.now();
      const delta = Math.min(Math.max(now - previous, 0), MAX_TICK_DELTA_MS);
      previous = now;
      if (pageVisible && !document.hidden) loadActiveMs.current += delta;
      if (loadActiveMs.current >= LOAD_TIMEOUT_MS) setFailed(true);
    }, TICK_MS);
    return () => clock.clearInterval(timeout);
  }, [parallax, eligible, visible, ready, failed, pageVisible]);

  useEffect(() => { setReady(false); }, [stage]);

  const mounted = eligible && !failed && (visible || ready);
  const active = visible && pageVisible && !paused && !exited;
  const enter = (event: React.MouseEvent<HTMLElement>) => {
    const action = resolveEnterAction({
      button: event.button, metaKey: event.metaKey, ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey, altKey: event.altKey,
      ready, eligible, failed,
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
    // 兩條路徑都立刻停止 3D；差別只在有沒有那層 ≤360ms 的淡出與推近。
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
      style={{ "--exit-transition-ms": `${EXIT_TRANSITION_MS}ms` } as React.CSSProperties}
      data-stage={stage}
      data-scene-state={failed ? "fallback" : ready && eligible ? "ready" : "poster"}
      data-scene-active={mounted && active} data-entering={entering} data-greeting={greeting} data-motion-phase={phase}>
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
          ? <button type="button" className={styles.cta} data-intro-dismiss onClick={enter}>進入車車遊樂園 <span aria-hidden="true">→</span></button>
          : <Link href="/?enter=1" replace className={styles.cta} onClick={enter}>進入車車遊樂園 <span aria-hidden="true">→</span></Link>}
        {ready && !failed && (parallax ? !reducedMotion : quality !== "low") ? (
          <button
            type="button"
            className={styles.pause}
            aria-label={paused ? "繼續小紅的旅程" : "暫停小紅的旅程"}
            onClick={() => setPaused((current) => !current)}
          >
            {paused ? "繼續動態" : "暫停動態"}
          </button>
        ) : null}
      </div>
      </div>
      {parallax ? (
        <HeroParallax running={active} deferImages={overlay} onReady={() => setReady(true)} />
      ) : (
      <div className={styles.stage} aria-hidden="true" data-hero-stage>
        <picture className={styles.poster}>
          <source media="(max-width: 768px)" srcSet={`${MODEL_PATH}/poster-mobile.webp`} type="image/webp" />
          <img src={`${MODEL_PATH}/poster.webp`} width={1380} height={980} alt="" fetchPriority="high" decoding="async" />
        </picture>
        {mounted ? <div className={styles.canvas} data-ready={ready}>
          <SceneBoundary onFailure={fail}>
            <Scene active={active} quality={quality} run={0}
              onReady={() => setReady(true)} onFailure={fail} onPhase={setPhase}
              onFinish={() => setGreeting(false)} onGreeting={setGreeting} onQuality={setQuality} />
          </SceneBoundary>
        </div> : null}
      </div>
      )}
      {/* href 維持 `/?enter=1`：那是無 JS 與深連結的語意入口。JS 可用時兩個連結
          都改由 router 送到乾淨的 `/`，canonical 不變。覆蓋層已經在 `/` 上，
          所以那裡的出口是按鈕。 */}
      {overlay
        ? <button type="button" className={styles.skip} data-intro-dismiss onClick={enter}>略過動畫</button>
        : <Link href="/?enter=1" replace className={styles.skip} onClick={enter}>略過動畫</Link>}
    </section>
  );
}
