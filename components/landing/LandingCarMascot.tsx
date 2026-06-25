"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { useVisibilityPause } from "@/lib/gamekit/react/useVisibilityPause";
import {
  nextDelayMs,
  pickAppearance,
  type MascotAppearance,
} from "@/lib/landing-mascot";
import ClayCar from "./ClayCar";
import styles from "./LandingCarMascot.module.css";

/** 下緣安全帶：車道貼著視窗底部 76%～88%，像在地面行駛、避開正文標題。 */
const BAND_TOP_PCT = 76;
const BAND_HEIGHT_PCT = 12;

/**
 * Landing 隨機小車車彩蛋：純裝飾覆蓋層。
 * - pointer-events:none + aria-hidden → 不影響閱讀與操作
 * - prefers-reduced-motion → 完全不渲染
 * - 分頁不可見 → 暫停動畫並停止排程
 */
export default function LandingCarMascot() {
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const [appearance, setAppearance] = useState<MascotAppearance | null>(null);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const firstRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    clearTimer();
    const delay = nextDelayMs(Math.random, firstRef.current);
    firstRef.current = false;
    timerRef.current = window.setTimeout(() => {
      setAppearance(pickAppearance(Math.random));
    }, delay);
  }, [clearTimer]);

  // 啟動與停用：reduce-motion 或暫停時不排程，且收掉進行中的車。
  useEffect(() => {
    if (reduced || paused) {
      clearTimer();
      return;
    }
    if (appearance === null) {
      scheduleNext();
    }
    return clearTimer;
  }, [reduced, paused, appearance, scheduleNext, clearTimer]);

  // 分頁可見性：隱藏時暫停，回來時恢復排程。
  useVisibilityPause({
    onHidden: () => setPaused(true),
    onVisible: () => setPaused(false),
  });

  // 行駛動畫結束 → 收車並排下一次（忽略子元素冒泡的循環動畫）。
  const handleAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      setAppearance(null);
    },
    [],
  );

  if (reduced) {
    return (
      <div
        className={styles.root}
        aria-hidden="true"
        data-testid="landing-car-mascot"
      />
    );
  }

  return (
    <div
      className={styles.root}
      aria-hidden="true"
      data-paused={paused ? "true" : "false"}
      data-coarse={coarse ? "true" : "false"}
      data-testid="landing-car-mascot"
    >
      {appearance && (
        <div
          className={styles.lane}
          style={{
            top: `${BAND_TOP_PCT + appearance.lane * BAND_HEIGHT_PCT}vh`,
          }}
        >
          <div
            key={`${appearance.expression}-${appearance.durationMs}-${appearance.edge}-${appearance.lane}`}
            className={`${styles.driver} ${
              appearance.edge === "left" ? styles.driveLeft : styles.driveRight
            }`}
            style={{ ["--trip" as string]: `${appearance.durationMs}ms` }}
            onAnimationEnd={handleAnimationEnd}
          >
            <div
              className={
                appearance.edge === "left" ? styles.facingRight : undefined
              }
            >
              <div className={styles.bob}>
                <ClayCar expression={appearance.expression} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
