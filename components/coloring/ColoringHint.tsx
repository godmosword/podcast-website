"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { COLORING_HINT_DRAW, COLORING_HINT_FILL } from "@/lib/coloring/flow";
import styles from "./ColoringHint.module.css";

type ColoringHintProps = {
  step: "draw" | "fill";
  /** 目前選的顏色：手指點到的色點跟著變。 */
  colorHex: string;
};

type Spot = { x: number; y: number };

/**
 * 第一次塗的時候，一隻手指先點色盤、再點圖。
 * 不靠句子。zh-TW 語音在很多手機上沒有聲音或會講錯，所以這裡不呼叫語音合成。
 */
export function ColoringHint({ step, colorHex }: ColoringHintProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState<Spot | null>(null);
  const [to, setTo] = useState<Spot | null>(null);
  const text = step === "fill" ? COLORING_HINT_FILL : COLORING_HINT_DRAW;

  useLayoutEffect(() => {
    const hint = rootRef.current;
    const root = hint?.closest("[data-coloring-root]");
    if (!hint || !root) return;

    const place = () => {
      const base = root.getBoundingClientRect();
      const swatch = root.querySelector('[role="option"]');
      const canvas = root.querySelector("canvas");
      if (!swatch || !canvas) return;
      const color = swatch.getBoundingClientRect();
      const art = canvas.getBoundingClientRect();
      setFrom({
        x: color.left - base.left + color.width / 2,
        y: color.top - base.top + color.height / 2,
      });
      setTo({
        x: art.left - base.left + art.width / 2,
        y: art.top - base.top + art.height * 0.42,
      });
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(root);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [step]);

  const vars = from && to
    ? ({
        "--x1": `${from.x}px`,
        "--y1": `${from.y}px`,
        "--x2": `${to.x}px`,
        "--y2": `${to.y}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      ref={rootRef}
      className={styles.hint}
      data-testid="coloring-open-hint"
      data-step={step}
    >
      <p className={styles.srOnly}>{text}</p>
      {vars ? (
        <>
          <Finger className={styles.finger} style={vars} colorHex={colorHex} />
          <Finger className={styles.fingerStill} style={vars} colorHex={colorHex} />
        </>
      ) : null}
    </div>
  );
}

function Finger({
  className,
  style,
  colorHex,
}: {
  className: string;
  style: CSSProperties;
  colorHex: string;
}) {
  return (
    <div className={className} style={style} aria-hidden="true">
      <span className={styles.dot} style={{ background: colorHex }} />
      <svg className={styles.hand} viewBox="0 0 64 64" focusable="false">
        <path
          d="M28 18c0-4 3-7 6.2-7 3.4 0 5.8 2.8 5.8 6.4V34l6.2-3.2c2.4-1.2 5.2.2 5.6 2.8.3 2.2-.8 4.2-2.6 5.2L38 48.5c-3.2 2.2-7 3.4-11 3.4-8.2 0-14-5.4-14-13.2V30.2c0-2.6 2-4.6 4.6-4.6 1.6 0 3 .8 3.8 2.1V24c0-2.4 1.8-4.4 4.2-4.4 1.5 0 2.8.8 3.6 2v-3.6Z"
          fill="#ffe3c4"
          stroke="#5d4a67"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
