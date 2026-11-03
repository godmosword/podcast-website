"use client";

import { useId, useRef, type CSSProperties } from "react";
import { OrangeExpressGauge } from "@/components/games/OrangeExpressGauge";
import { HornIcon, XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
import { OrangeExpressNextHand } from "@/components/games/OrangeExpressNextHand";
import { OrangeExpressSeats } from "@/components/games/OrangeExpressSeats";
import {
  brakeLampLabel,
  brakeValueText,
  COPY,
  powerLampLabel,
  powerValueText,
} from "@/lib/games/orange-express/copy";
import { xiaojuMood } from "@/lib/games/orange-express/mood";
import {
  dragIndex,
  grabOffset,
  notchToStep,
  sliderKeyTarget,
  type LeverFrame,
  type LeverKind,
} from "@/lib/games/orange-express/lever";
import { BRAKE_ACCEL, POWER_ACCEL, effortNotch } from "@/lib/games/orange-express/physics";
import type { NextAction } from "@/lib/games/orange-express/next-action";
import { COURSE_RULES } from "@/lib/games/orange-express/routes";
import {
  brakeNotches,
  currentLimit,
  inTunnel,
  powerNotches,
  simpleLevers,
} from "@/lib/games/orange-express/reducer";
import {
  EMERGENCY,
  type BrakeNotch,
  type PowerNotch,
  type RunState,
} from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";


/** 動力「慢」「快」：一個、兩個往上的箭頭。不識字的孩子看箭頭多寡就知道快慢。 */
function PowerArrows({ count }: { count: 1 | 2 }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.notchGlyph}>
      {count === 2 ? (
        <path d="M6 12l6-6 6 6M6 19l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/**
 * 圖示桿面每格的圖：歸零格是虛線空格（不畫圖）；動力一個、兩個箭頭；
 * 煞車「停」（B3）用停車柱（跟前窗的停車柱、駕駛台的停車燈同一個符號），大司機的「輕」（B2）是矮一半的停車柱，
 * 靠形狀跟「停」分開，不只靠顏色深淺；「緊急」靠紅底，不另畫圖。
 */
function NotchGlyph({ kind, step, notch }: { kind: LeverKind; step: number; notch: number }) {
  if (step === 0) return null;
  if (kind === "power") return <PowerArrows count={step >= 2 ? 2 : 1} />;
  if (notch === STOP_NOTCH || notch === LIGHT_NOTCH) {
    return (
      <span className={styles.notchGlyph} aria-hidden>
        {notch === STOP_NOTCH ? <StopIcon /> : <LightStopIcon />}
      </span>
    );
  }
  return null;
}

/** 煞車「停」與「輕」的格號（圖示桿面）。 */
const STOP_NOTCH = 3;
const LIGHT_NOTCH = 2;

/**
 * 桿上只排這一組摸得到的格：低齡（慢慢看、小小司機）兩根桿各三格，大司機動力三格、煞車四格，小站長是 P0–P4、B0–B4＋緊急。
 * 位置、aria、拖曳與方向鍵都用格子的索引；`data-notch` 留真正的格號，`data-step` 是由下往上第幾格。
 */
function Lever({
  kind,
  notch,
  notches,
  simple,
  effort,
  effortScale,
  showEffort,
  next = null,
  onChange,
}: {
  kind: LeverKind;
  notch: number;
  notches: readonly number[];
  /** 低齡桿面：格上畫圖示、常駐底色，字縮小放圖下，不寫 P／B 代碼。 */
  simple: boolean;
  /** 實際出力；只在大司機與小站長顯示，不把延遲再加到低齡桿面。 */
  effort: number;
  effortScale: readonly number[];
  showEffort: boolean;
  /** 現在該碰這根桿（PR-J1）：notch 是要推到的那一格，null 是整根桿。 */
  next?: NextAction | null;
  onChange: (notch: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  /** 正在拖的那根手指（只認主要的那一根）與抓取偏移；第二根手指不影響。 */
  const drag = useRef<{ id: number; offset: number } | null>(null);
  const keysId = useId();
  const label = kind === "power" ? COPY.power : COPY.brake;
  const simplePowers = kind === "power" && simple ? (notches as readonly PowerNotch[]) : undefined;
  const valueText =
    kind === "power"
      ? powerValueText(notch as PowerNotch, simplePowers)
      : brakeValueText(notch as BrakeNotch, simple);
  const last = notches.length - 1;
  const found = notches.indexOf(notch);
  const index = found >= 0 ? found : 0;
  // 作用換成格號，再換成這根桿上的第幾格：大司機煞車只有 0、2、3、5 四格，B2 的作用要填到「輕」那格。
  const effortIndex = notchToStep(notches, effortNotch(effortScale, effort));
  const effortFill = `${Math.max(0, Math.min(100, (effortIndex / last) * 100))}%`;
  const rows = Array.from({ length: notches.length }, (_, i) => last - i);
  const pick = (i: number) => onChange(notches[Math.min(last, Math.max(0, i))]!);
  // 拖曳中的換檔要跟最新的格比；換檔被擋下（例如門開著推不動）時下一次移動再試。
  const indexRef = useRef(index);
  indexRef.current = index;

  const frame = (): LeverFrame | null => {
    const el = ref.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { top: rect.top, height: rect.height, last };
  };

  return (
    <div className={styles.leverColumn} data-kind={kind} data-testid={`orange-express-${kind}-lever`}>
      {/* 桿頂只寫「動力／煞車」：現在在哪一格看桿子本身（PR-J2 拿掉重複的狀態小牌；讀屏的 aria-valuetext 照說）。 */}
      <span className={styles.leverTitle}>{label}</span>
      <div
        ref={ref}
        className={styles.lever}
        data-kind={kind}
        data-simple={simple ? "true" : "false"}
        data-effort={showEffort ? "true" : "false"}
        data-next={next && next.notch === null ? "true" : undefined}
        role="slider"
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
        aria-valuetext={valueText}
        tabIndex={0}
        style={{ "--notches": notches.length, "--at": last - index, "--effort-fill": effortFill } as CSSProperties}
        aria-keyshortcuts={kind === "power" ? "ArrowUp ArrowDown Home End" : "ArrowLeft ArrowRight Home End"}
        aria-describedby={keysId}
        onPointerDown={(event) => {
          // 只認滑鼠左鍵與第一根手指；已經有手指在拖，第二根不接手。
          if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
          if (drag.current) return;
          const f = frame();
          if (!f) return;
          // 按在握把那一格就抓住（記偏移、不換檔）；按在別格或空白處就跳過去。
          const grab = grabOffset({ ...f, y: event.clientY, current: indexRef.current });
          if (!grab.grab) pick(grab.index);
          drag.current = { id: event.pointerId, offset: grab.offset };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const d = drag.current;
          if (!d || event.pointerId !== d.id) return;
          const f = frame();
          if (!f) return;
          // 扣掉抓取偏移、跨過格線再多一小段才換檔：手指微抖不會跳格。
          const next = dragIndex({ ...f, y: event.clientY - d.offset, current: indexRef.current });
          if (next !== indexRef.current) pick(next);
        }}
        onPointerUp={(event) => {
          if (drag.current?.id !== event.pointerId) return;
          drag.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          if (drag.current?.id === event.pointerId) drag.current = null;
        }}
        // 瀏覽器取消或搶走 capture（例如系統手勢）時也放手，不留著半套拖曳。
        onLostPointerCapture={(event) => {
          if (drag.current?.id === event.pointerId) drag.current = null;
        }}
        onKeyDown={(event) => {
          // ↑↓ 永遠是動力、←→ 永遠是煞車：煞車桿的方向鍵交給整頁；Home／End 作用在這根。
          const next = sliderKeyTarget(kind, event.key, index, last);
          if (next === null) return;
          event.preventDefault();
          event.stopPropagation();
          pick(next);
        }}
      >
        <span id={keysId} className={styles.srOnly}>
          {COPY.leverKeys}
        </span>
        <span className={styles.leverSlot} aria-hidden>
          <span className={styles.leverEffort} data-testid={`orange-express-${kind}-effort`} />
        </span>
        <span className={styles.leverHandle} aria-hidden>
          <span className={styles.leverGrip} />
        </span>
        {next && next.notch === null ? <OrangeExpressNextHand at="lever" dir={next.dir} /> : null}
        <span className={styles.notchPlate} aria-hidden>
          {rows.map((i) => {
            const n = notches[i]!;
            const text =
              kind === "power"
                ? powerLampLabel(n as PowerNotch, simplePowers)
                : brakeLampLabel(n as BrakeNotch, simple);
            return (
              <span
                key={n}
                className={styles.notchLamp}
                data-notch={n}
                data-step={i}
                data-next={next?.notch === n ? "true" : undefined}
                data-on={n === notch && n > 0 ? "true" : "false"}
                data-emergency={
                  kind === "brake" && n === EMERGENCY ? "true" : "false"
                }
                onClick={() => pick(i)}
              >
                {simple ? <NotchGlyph kind={kind} step={i} notch={n} /> : null}
                <span className={styles.notchText}>{text}</span>
                {next?.notch === n ? <OrangeExpressNextHand at="notch" dir={next.dir} /> : null}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}

/** 不給 size 時由外層 CSS 決定大小（燈泡、車門鈕）；結算小籤沒有那層 CSS，要給 size。 */
type GlyphProps = { size?: number };

export function DoorIcon({ size }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <rect
        x="4"
        y="3"
        width="7"
        height="18"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <rect
        x="13"
        y="3"
        width="7"
        height="18"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M8 12h1M15 12h1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StopIcon({ size }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d="M12 21v-9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="8"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
    </svg>
  );
}

/** 「輕」：矮一半、圓頭小一點的停車柱。結算的下趟小目標「輕輕停」也用它。 */
export function LightStopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 21v-4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="13" r="3.8" fill="none" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

export function OrangeExpressCab({
  run,
  shake,
  numbers,
  onPower,
  onBrake,
  onHorn,
  onDoor,
  next = null,
  cheer = false,
}: {
  run: RunState;
  shake: boolean;
  numbers: boolean;
  /** 剛在降速牌前提前慢下來：小橘開心一秒。 */
  cheer?: boolean;
  /**
   * 現在只該亮的那一個控制（PR-J1，View 算一次）：那一個帶 data-next 與手指，其他控制淡一點、照樣能按。
   * 取代原本各自亮的事件格、示範、先鬆煞車、喇叭黃圈、車門光圈。
   */
  next?: NextAction | null;
  onPower: (notch: number) => void;
  onBrake: (notch: number) => void;
  onHorn: () => void;
  onDoor: () => void;
}) {
  const station = run.stations[run.stationIndex];
  const limit = currentLimit(run);
  const waiting = station != null && run.boarded < station.passengers.length;
  const doorLabel =
    run.phase === "doors-open"
      ? waiting
        ? COPY.boarding
        : COPY.closeDoors
      : COPY.openDoors;
  const doorReady =
    run.phase === "stopped" || (run.phase === "doors-open" && !waiting);
  const tunnel = inTunnel(run);
  const simple = simpleLevers(run.course);
  // 桿槽填色看實際出力：只有有重量感的大司機、小站長才畫（低齡幾乎即時，畫了只是多一樣東西）。
  const showEffort = run.course === "big" || run.course === "captain";
  const powers = powerNotches(run.course);

  return (
    <div
      className={styles.cab}
      data-testid="orange-express-cab"
      data-tunnel={tunnel ? "true" : "false"}
      data-auto-brake={run.autoBrake ? "true" : "false"}
      data-simple={simple ? "true" : "false"}
      data-focus={next ? next.control : undefined}
    >
      {/*
        中間那一格（PR-J2 減法）：小橘、要接的朋友座位、速度表。燈、站名牌拿掉了：站名與「下一站」由座位的地標章
        與讀屏那句帶，門、停車的狀態看車門鈕與停車目標條。不另佔一列，高度留給前窗。DOM 放最前，讀屏先聽到要接誰。
      */}
      <div className={styles.dash}>
        <div className={styles.dashHead}>
          <XiaojuFace className={styles.badge} mood={xiaojuMood(run, cheer)} />
          <OrangeExpressSeats run={run} />
        </div>
        <OrangeExpressGauge speed={run.speed} limit={limit} numbers={numbers} flag={COURSE_RULES[run.course].speedFlag} />
      </div>
      <Lever
        kind="power"
        notch={run.power}
        notches={powers}
        simple={simple}
        effort={run.tractive}
        effortScale={POWER_ACCEL}
        showEffort={showEffort}
        next={next?.control === "power" ? next : null}
        onChange={onPower}
      />
      <Lever
        kind="brake"
        notch={run.brake}
        notches={brakeNotches(run.course)}
        simple={simple}
        effort={run.braking}
        effortScale={BRAKE_ACCEL}
        showEffort={showEffort}
        next={next?.control === "brake" ? next : null}
        onChange={onBrake}
      />
      <div className={styles.cabBottom}>
        <button
          type="button"
          className={styles.horn}
          aria-label={COPY.horn}
          data-next={next?.control === "horn" ? "true" : undefined}
          data-testid="orange-express-horn"
          onClick={onHorn}
        >
          <HornIcon />
          {next?.control === "horn" ? <OrangeExpressNextHand at="button" /> : null}
        </button>
        <button
          type="button"
          className={styles.door}
          data-shake={shake ? "true" : "false"}
          data-next={next?.control === "door" ? "true" : undefined}
          aria-disabled={doorReady ? undefined : true}
          data-testid="orange-express-door"
          onClick={onDoor}
        >
          <DoorIcon />
          <span className={styles.doorLabel}>{doorLabel}</span>
          {next?.control === "door" ? <OrangeExpressNextHand at="button" /> : null}
        </button>
      </div>
    </div>
  );
}
