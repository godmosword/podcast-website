"use client";

import { useEffect, useRef, type Ref } from "react";
import { OrangeExpressStopBar } from "@/components/games/OrangeExpressStopBar";
import { currentStation } from "@/lib/games/orange-express/reducer";
import { drawWindshield, windshieldFrame } from "@/lib/games/orange-express/windshield";
import type { PassengerId, RunState } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

type RiderProps = { id: PassengerId };

function RiderFace({ id }: RiderProps) {
  if (id === "mami") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="26" r="14" fill="rgb(255, 224, 196)" />
        <path d="M10 24c2-12 26-12 28 0" fill="rgb(120, 78, 52)" />
        <rect x="8" y="20" width="6" height="10" rx="3" fill="rgb(255, 150, 80)" />
        <rect x="34" y="20" width="6" height="10" rx="3" fill="rgb(255, 150, 80)" />
        <circle cx="19" cy="26" r="2" fill="rgb(50, 42, 36)" />
        <circle cx="29" cy="26" r="2" fill="rgb(50, 42, 36)" />
        <path d="M20 32c2 2 6 2 8 0" fill="none" stroke="rgb(50, 42, 36)" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "xiaonan") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden>
        <rect x="8" y="16" width="32" height="20" rx="8" fill="rgb(236, 240, 244)" />
        <rect x="8" y="24" width="32" height="5" fill="rgb(90, 160, 210)" />
        <rect x="8" y="29" width="32" height="3" fill="rgb(120, 190, 140)" />
        <circle cx="18" cy="22" r="2" fill="rgb(50, 42, 36)" />
        <circle cx="30" cy="22" r="2" fill="rgb(50, 42, 36)" />
        <path d="M20 31c2 2 6 2 8 0" fill="none" stroke="rgb(50, 42, 36)" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "dot") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden>
        <rect x="10" y="12" width="28" height="28" rx="8" fill="rgb(190, 160, 230)" />
        <circle cx="19" cy="24" r="2" fill="rgb(50, 42, 36)" />
        <circle cx="29" cy="24" r="2" fill="rgb(50, 42, 36)" />
        <path d="M20 30c2 2 6 2 8 0" fill="none" stroke="rgb(50, 42, 36)" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="28" r="13" fill="rgb(255, 224, 196)" />
      <circle cx="24" cy="16" r="10" fill="rgb(140, 96, 64)" />
      <circle cx="19" cy="28" r="2" fill="rgb(50, 42, 36)" />
      <circle cx="29" cy="28" r="2" fill="rgb(50, 42, 36)" />
      <circle cx="15" cy="32" r="2.4" fill="rgb(255, 170, 180)" />
      <circle cx="33" cy="32" r="2.4" fill="rgb(255, 170, 180)" />
      <path d="M20 33c2 3 6 3 8 0" fill="none" stroke="rgb(50, 42, 36)" strokeWidth="1.6" />
    </svg>
  );
}

export function OrangeExpressWindshield({
  run,
  reduced,
  numbers,
  swayRef,
}: {
  run: RunState;
  reduced: boolean;
  numbers: boolean;
  swayRef: Ref<HTMLDivElement>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = windshieldFrame(run.progress, run.phase);
  const station = run.stations[run.stationIndex];
  const target = currentStation(run).target;
  const showRiders = frame === 2 && station != null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW < 2 || cssH < 2) return;
      const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
      const dpr =
        cssW < 360 || nav.connection?.saveData === true
          ? 1
          : Math.min(window.devicePixelRatio || 1, 1.5);
      const nextW = Math.round(cssW * dpr);
      const nextH = Math.round(cssH * dpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawWindshield(ctx, cssW, cssH, {
        progress: run.progress,
        phase: run.phase,
        reduced,
        target,
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [reduced, run.phase, run.progress, target]);

  return (
    <div className={styles.windshield} data-testid="orange-express-windshield">
      <div ref={swayRef} className={styles.glassWrap}>
        <canvas ref={canvasRef} className={styles.glass} aria-hidden />
      </div>
      <span className={styles.pillarLeft} aria-hidden />
      <span className={styles.pillarRight} aria-hidden />
      <OrangeExpressStopBar run={run} numbers={numbers} />
      {showRiders ? (
        <ul className={styles.riders} aria-label="月台上的朋友">
          {station.passengers.map((rider, index) => (
            <li
              key={rider.id}
              data-boarded={run.phase === "doors-open" && index < run.boarded ? "true" : "false"}
            >
              <RiderFace id={rider.id} />
              <span>{rider.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
