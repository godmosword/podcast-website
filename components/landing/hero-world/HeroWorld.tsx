"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INTRO_VISIT_KEY } from "@/components/intro/IntroVisit";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { MODEL_PATH, chooseQuality, type MotionPhase, type Quality } from "./config";
import styles from "./HeroWorld.module.css";
import { getActiveClock, LOAD_TIMEOUT_MS, MAX_TICK_DELTA_MS, SLEEP_AFTER_MS, TICK_MS } from "./active-clock";

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

export default function HeroWorld() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    if (transitionResetTimer.current) clearTimeout(transitionResetTimer.current);
  }, []);
  const remember = () => { try { sessionStorage.setItem(INTRO_VISIT_KEY, "1"); } catch {} };
  const root = useRef<HTMLElement>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [quality, setQuality] = useState<Quality>("medium");
  const [paused, setPaused] = useState(false);
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
  }, []);

  // 上限避免慢速／卡住的模型讓空白 canvas 長期蓋住備用圖。只累計
  // active time；切到背景分頁時不把瀏覽器的 wall-clock 暫停算進來。
  useEffect(() => {
    if (!eligible || ready || failed) {
      loadActiveMs.current = 0;
      return;
    }
  }, [eligible, ready, failed]);

  useEffect(() => {
    if (!eligible || !visible || ready || failed) return;
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
  }, [eligible, visible, ready, failed, pageVisible]);

  const mounted = eligible && !failed && (visible || ready);
  const active = visible && pageVisible && !paused;
  const enter = (event: React.MouseEvent<HTMLAnchorElement>) => {
    remember();
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (!ready || !eligible || failed || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (exitTimer.current || entering) return;
    setEntering(true);
    exitTimer.current = setTimeout(() => {
      exitTimer.current = null;
      router.replace("/?enter=1");
    }, 360);
    // If a client route chunk fails, restore the native links instead of
    // leaving an opaque transition overlay permanently over the page.
    transitionResetTimer.current = setTimeout(() => {
      transitionResetTimer.current = null;
      setEntering(false);
    }, 1_500);
  };
  return (
      <section ref={root} className={styles.hero} aria-labelledby="intro-title" data-hero-world
      data-scene-state={failed ? "fallback" : ready && eligible ? "ready" : "poster"}
      data-scene-active={mounted && active} data-entering={entering} data-greeting={greeting} data-motion-phase={phase}>
      <div className={styles.copy}>
        <h1 id="intro-title" className={styles.title}>車車遊樂園</h1>
        <p className={styles.description}>故事，就從這裡出發。</p>
      </div>
      <div className={styles.stage} aria-hidden="true" data-hero-stage>
        <picture className={styles.poster}>
          <source media="(max-width: 768px)" srcSet={`${MODEL_PATH}/poster-mobile.webp`} type="image/webp" />
          <img src={`${MODEL_PATH}/poster.webp`} width={1380} height={980} alt="" fetchPriority="high" decoding="async" />
        </picture>
        {mounted ? <div className={styles.canvas} data-ready={ready}>
          <SceneBoundary onFailure={fail}>
            <Scene active={active} quality={quality} run={0} entering={entering}
              onReady={() => setReady(true)} onFailure={fail} onPhase={setPhase}
              onFinish={() => setGreeting(false)} onGreeting={setGreeting} onQuality={setQuality} />
          </SceneBoundary>
        </div> : null}
      </div>
      <div className={styles.actions}>
        <Link href="/?enter=1" replace className={styles.cta} onClick={enter}>進入車車遊樂園 <span aria-hidden="true">→</span></Link>
        {ready && !failed && quality !== "low" ? (
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
      <Link href="/?enter=1" replace className={styles.skip} onClick={remember}>略過動畫</Link>
    </section>
  );
}
