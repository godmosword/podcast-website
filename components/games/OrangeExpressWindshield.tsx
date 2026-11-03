"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type Ref } from "react";
import { DoorIcon } from "@/components/games/OrangeExpressCab";
import { NoticeGlyph, RiderFace, XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
import { OrangeExpressMissionCard } from "@/components/games/OrangeExpressMissionCard";
import { OrangeExpressRouteStrip } from "@/components/games/OrangeExpressRouteStrip";
import type { MissionState } from "@/components/games/useOrangeExpressMission";
import { OrangeExpressStopBar } from "@/components/games/OrangeExpressStopBar";
import { canvasDpr } from "@/lib/games/orange-express/canvas-dpr";
import { COPY, POINT_CALL, POINT_WHAT } from "@/lib/games/orange-express/copy";
import type { CoachBeat } from "@/lib/games/orange-express/coach";
import { activeEvent } from "@/lib/games/orange-express/events";
import { noticeWithDoorHint } from "@/lib/games/orange-express/notice";
import { currentStation, pendingPoint } from "@/lib/games/orange-express/reducer";
import { routeStripFor } from "@/lib/games/orange-express/route-strip";
import { drawWindshield, windshieldFrame } from "@/lib/games/orange-express/windshield";
import type { RunState } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

/** 任務卡收好後，路線條章依序彈一下的總長（三個章、每個晚 120ms、各 420ms）。 */
const ROUTE_ARRIVE_MS = 900;

/** 跟 CSS 的直式矮螢幕斷點同一個條件：停車目標條讓出右邊一欄，地標改放那裡。 */
const COMPACT_QUERY = "(orientation: portrait) and (max-height: 600px)";

function subscribeCompact(onChange: () => void): () => void {
  const media = window.matchMedia(COMPACT_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useCompactWindshield(): boolean {
  return useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
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

/** 朋友上車：頭像旁冒一個愛心泡泡（沒有字，不識字也看得懂）。 */
function RiderHeart() {
  return (
    <span className={styles.riderHeart} aria-hidden>
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="rgb(255, 250, 240)" stroke="rgb(58, 46, 40)" strokeWidth="1.6" />
        <path d="M12 18s-6-3.6-6-7.6A3.2 3.2 0 0 1 12 8.6a3.2 3.2 0 0 1 6 1.8C18 14.4 12 18 12 18z" fill="rgb(247, 120, 150)" />
      </svg>
    </span>
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
  coach,
  nod,
  nodBeforeHappy,
  cheer = false,
  mission = null,
  onPoint,
}: {
  run: RunState;
  reduced: boolean;
  numbers: boolean;
  swayRef: Ref<HTMLDivElement>;
  /** 門還沒亮就按了：右上（或停車目標條）說「門亮了再按」。 */
  doorHint: boolean;
  /** 第一次進站示範的這一拍；示範那一站不出月台指差確認題。 */
  coach: { beat: CoachBeat; on: boolean };
  /** 頓停時在畫面晃動已開啟的情況下，輕輕點頭一次。 */
  nod: boolean;
  nodBeforeHappy: boolean;
  /** 剛在降速牌前提前慢下來（或沿途事件做到了）：小橘開心一秒。 */
  cheer?: boolean;
  /** 開局任務卡（大司機）。 */
  mission?: MissionState;
  onPoint: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compact = useCompactWindshield();
  const frame = windshieldFrame(run.progress, run.phase);
  const station = run.stations[run.stationIndex];
  const here = currentStation(run);
  const target = here.target;
  const showRiders = frame === 2 && station != null;
  const notice = noticeWithDoorHint(run, numbers, doorHint);
  const showNotice = notice !== null && !showRiders;
  // 上緣同一時間只放一樣：停車目標條＞前窗提示＞路線條。
  // 任務卡在的時候路線條先不出（同一串章與頭像不畫兩次）；任務卡收起時才出現，像是縮進去。
  const strip = showNotice || mission === "shown" ? null : routeStripFor(run);
  // 任務卡剛收好：路線條上的站點章依序彈一下，接上「剛剛那張卡變成這一條」。
  const [arrive, setArrive] = useState(false);
  const missionBefore = useRef(mission);
  useEffect(() => {
    const before = missionBefore.current;
    missionBefore.current = mission;
    if (before !== "leaving" || mission !== null) return;
    setArrive(true);
    const timer = window.setTimeout(() => setArrive(false), ROUTE_ARRIVE_MS);
    return () => window.clearTimeout(timer);
  }, [mission]);
  const pending = pendingPoint(run);
  const task = coach.on && pending?.kind === "platform" ? null : pending;
  const signalHalo = run.signal === "red" && run.power > 0;
  const event = activeEvent(run);
  const eventKind = event?.kind ?? null;
  const eventAt = event?.at ?? null;
  const eventResult = event ? (run.events[event.key] ?? null) : null;

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
      const dpr = canvasDpr(cssW, cssH, window.devicePixelRatio || 1, nav.connection?.saveData === true);
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
        scenic: here.scenic,
        signs: here.signs,
        passing: run.passing,
        signal: run.signal,
        signalHalo,
        landmark: here.landmark,
        compact,
        event:
          eventKind !== null && eventAt !== null
            ? {
                kind: eventKind,
                scene: here.scene,
                at: eventAt,
                result: eventResult,
                time: performance.now() / 1000,
                speed: run.speed,
              }
            : null,
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [
    compact,
    reduced,
    run.phase,
    run.progress,
    run.speed,
    run.passing,
    run.signal,
    signalHalo,
    here,
    target,
    eventKind,
    eventAt,
    eventResult,
  ]);

  return (
    <div
      className={styles.windshield}
      data-testid="orange-express-windshield"
      data-scene={here.scene}
      data-notice={notice?.kind ?? "none"}
      data-nod={nod ? "true" : "false"}
      data-signal={run.signal}
      data-signal-halo={signalHalo ? "true" : "false"}
      data-event={eventKind ?? "none"}
      data-event-result={eventResult ?? "none"}
      data-point={task ? "true" : "false"}
    >
      <div ref={swayRef} className={styles.glassWrap}>
        <canvas ref={canvasRef} className={styles.glass} aria-hidden />
      </div>
      <span className={styles.pillarLeft} aria-hidden />
      <span className={styles.pillarRight} aria-hidden />
      <OrangeExpressStopBar
        run={run}
        numbers={numbers}
        hint={doorHint ? COPY.earlyDoorHint : null}
        coach={coach.beat}
        nodBeforeHappy={nodBeforeHappy}
        cheer={cheer}
      />
      {strip ? <OrangeExpressRouteStrip strip={strip} arrive={arrive} /> : null}
      {notice && showNotice ? (
        <p
          className={styles.notice}
          data-kind={notice.kind}
          data-event={notice.event?.kind}
          data-done={notice.event ? (notice.event.done ? "true" : "false") : undefined}
          data-testid="orange-express-notice"
        >
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
      {mission ? <OrangeExpressMissionCard stations={run.stations} state={mission} /> : null}
      {/* 做到事件、提前慢下來：小橘在前窗右下角探頭笑（PR-I2）。矮手機收起了儀表徽章，風景段也沒有停車目標條，這裡是孩子正在看的地方。 */}
      {cheer && !showRiders ? (
        <span className={styles.cheerFace} data-testid="orange-express-cheer" aria-hidden>
          <XiaojuFace mood="happy" />
        </span>
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
                  {boarded ? <RiderHeart /> : null}
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
