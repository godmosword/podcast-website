"use client";

import { useEffect, useRef, type Ref } from "react";
import { DoorIcon } from "@/components/games/OrangeExpressCab";
import { NoticeGlyph } from "@/components/games/OrangeExpressGlyphs";
import { OrangeExpressStopBar } from "@/components/games/OrangeExpressStopBar";
import { COPY, POINT_CALL, POINT_WHAT } from "@/lib/games/orange-express/copy";
import { noticeWithDoorHint } from "@/lib/games/orange-express/notice";
import { currentStation, pendingPoint } from "@/lib/games/orange-express/reducer";
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

/** 上車了：頭像滑走後原位留一個綠勾。 */
function BoardedCheck() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={styles.riderCheck}>
      <circle cx="20" cy="20" r="15" fill="rgb(150, 210, 160)" stroke="rgb(58, 46, 40)" strokeWidth="2.5" />
      <path d="M13 20.5l5 5 9-10" fill="none" stroke="rgb(58, 46, 40)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PointIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={styles.pointIcon}>
      <path
        d="M4 15h13a3 3 0 0 1 0 6h-2v1a3 3 0 0 1-3 3H8a4 4 0 0 1-4-4z"
        fill="rgb(255, 224, 196)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 15h16a2.5 2.5 0 0 1 0 5H17" fill="rgb(255, 224, 196)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function OrangeExpressWindshield({
  run,
  reduced,
  numbers,
  swayRef,
  doorHint,
  onPoint,
}: {
  run: RunState;
  reduced: boolean;
  numbers: boolean;
  swayRef: Ref<HTMLDivElement>;
  /** 門還沒亮就按了：右上（或停車目標條）說「門亮了再按」。 */
  doorHint: boolean;
  onPoint: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = windshieldFrame(run.progress, run.phase);
  const station = run.stations[run.stationIndex];
  const here = currentStation(run);
  const target = here.target;
  const showRiders = frame === 2 && station != null;
  const notice = noticeWithDoorHint(run, numbers, doorHint);
  const task = pendingPoint(run);

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
        scene: here.scene,
        tunnel: here.tunnel,
        bridge: here.bridge,
        signs: here.signs,
        passing: run.passing,
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [reduced, run.phase, run.progress, run.passing, here, target]);

  return (
    <div
      className={styles.windshield}
      data-testid="orange-express-windshield"
      data-scene={here.scene}
      data-notice={notice?.kind ?? "none"}
    >
      <div ref={swayRef} className={styles.glassWrap}>
        <canvas ref={canvasRef} className={styles.glass} aria-hidden />
      </div>
      <span className={styles.pillarLeft} aria-hidden />
      <span className={styles.pillarRight} aria-hidden />
      <OrangeExpressStopBar run={run} numbers={numbers} hint={doorHint ? COPY.earlyDoorHint : null} />
      {notice && !showRiders ? (
        <p className={styles.notice} data-kind={notice.kind} data-testid="orange-express-notice">
          {notice.kind === "door" ? (
            <span className={styles.noticeDoor} aria-hidden>
              <DoorIcon size={20} />
            </span>
          ) : (
            <NoticeGlyph notice={notice} />
          )}
          {notice.text}
        </p>
      ) : null}
      {task ? (
        // 貼右邊窗柱的手勢圓鈕，不蓋前窗中間；要喊的整句由朗讀與讀屏說，鈕下只標確認哪樣東西。
        <button
          type="button"
          className={styles.pointTask}
          data-kind={task.kind}
          data-testid="orange-express-point"
          aria-label={`${COPY.point}：${POINT_CALL[task.kind]}`}
          onClick={onPoint}
        >
          <PointIcon />
          <span className={styles.pointWhat} aria-hidden>
            {POINT_WHAT[task.kind]}
          </span>
        </button>
      ) : null}
      {showRiders ? (
        <ul className={styles.riders} aria-label="月台上的朋友">
          {station.passengers.map((rider, index) => {
            const boarded = run.phase === "doors-open" && index < run.boarded;
            return (
              <li key={rider.id} data-boarded={boarded ? "true" : "false"}>
                <span className={styles.riderSeat}>
                  <RiderFace id={rider.id} />
                  {boarded ? <BoardedCheck /> : null}
                </span>
                <span className={rider.showName === false ? styles.srOnly : undefined}>{rider.name}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
