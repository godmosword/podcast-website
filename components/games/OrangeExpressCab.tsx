"use client";

import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { OrangeExpressGauge } from "@/components/games/OrangeExpressGauge";
import { HornIcon, LandmarkGlyph, XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
import {
  brakeLampLabel,
  brakeValueText,
  brakeWord,
  COPY,
  powerLampLabel,
  powerValueText,
  powerWord,
} from "@/lib/games/orange-express/copy";
import { gaugeZone } from "@/lib/games/orange-express/gauge";
import { xiaojuMood } from "@/lib/games/orange-express/mood";
import { dragIndex, grabOffset, sliderKeyTarget, type LeverFrame, type LeverKind } from "@/lib/games/orange-express/lever";
import {
  brakeNotches,
  currentLimit,
  inTunnel,
  landmarkTaskPending,
  onBridge,
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
 * 低齡桿面每格的圖：歸零格是虛線空格（不畫圖）；動力一個、兩個箭頭；
 * 煞車「停」用停車柱（跟前窗的停車柱、駕駛台的停車燈同一個符號）；「緊急」靠紅底，不另畫圖。
 */
function NotchGlyph({ kind, step }: { kind: LeverKind; step: number }) {
  if (step === 0) return null;
  if (kind === "power") return <PowerArrows count={step >= 2 ? 2 : 1} />;
  if (step === 1) {
    return (
      <span className={styles.notchGlyph} aria-hidden>
        <StopIcon />
      </span>
    );
  }
  return null;
}

/**
 * 桿上只排這一組摸得到的格：低齡（慢慢看、小小司機）兩根桿各三格，大司機與小站長是 P0–P4、B0–B4＋緊急。
 * 位置、aria、拖曳與方向鍵都用格子的索引；`data-notch` 留真正的格號，`data-step` 是由下往上第幾格。
 */
function Lever({
  kind,
  notch,
  notches,
  simple,
  coach = false,
  release = false,
  onChange,
}: {
  kind: LeverKind;
  notch: number;
  notches: readonly number[];
  /** 低齡桿面：格上畫圖示、常駐底色，字縮小放圖下，不寫 P／B 代碼。 */
  simple: boolean;
  /** 第一次進站示範的煞車強調：低齡亮「停」那一格，大司機與小站長亮整根桿。 */
  coach?: boolean;
  /** 推了動力、煞車沒放、車不走：煞車桿亮「鬆」那一格（與桿頂的狀態小牌）。 */
  release?: boolean;
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
  const word =
    kind === "power"
      ? powerWord(notch as PowerNotch, simplePowers)
      : brakeWord(notch as BrakeNotch);
  const last = notches.length - 1;
  const found = notches.indexOf(notch);
  const index = found >= 0 ? found : 0;
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
    <div className={styles.leverColumn} data-kind={kind}>
      <span className={styles.leverTitle}>
        {label}
        <b
          className={styles.leverWord}
          data-testid={`orange-express-${kind}-word`}
          data-release={release ? "true" : "false"}
        >
          {release ? COPY.releaseWord : word}
        </b>
      </span>
      <div
        ref={ref}
        className={styles.lever}
        data-kind={kind}
        data-simple={simple ? "true" : "false"}
        data-coach={coach && !simple ? "true" : "false"}
        role="slider"
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
        aria-valuetext={valueText}
        tabIndex={0}
        style={{ "--notches": notches.length, "--at": last - index } as CSSProperties}
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
        <span className={styles.leverSlot} aria-hidden />
        <span className={styles.leverHandle} aria-hidden>
          <span className={styles.leverGrip} />
        </span>
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
                data-coach={coach && simple && i === 1 ? "true" : "false"}
                data-release={release && n === 0 ? "true" : "false"}
                data-on={n === notch && n > 0 ? "true" : "false"}
                data-emergency={
                  kind === "brake" && n === EMERGENCY ? "true" : "false"
                }
                onClick={() => pick(i)}
              >
                {simple ? <NotchGlyph kind={kind} step={i} /> : null}
                <span className={styles.notchText}>{text}</span>
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6 3v18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M7 4h11l-3 4 3 4H7z" fill="currentColor" />
    </svg>
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

function LightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M9.5 20.5h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

type LampState = "off" | "green" | "yellow" | "orange";

function Lamp({
  label,
  state,
  icon,
}: {
  label: string;
  state: LampState;
  icon: ReactNode;
}) {
  return (
    <li className={styles.lamp} data-lamp={state}>
      <span className={styles.lampBulb} aria-hidden>
        {icon}
      </span>
      <span className={styles.lampText}>{label}</span>
      <span className={styles.srOnly}>
        {state === "off" ? COPY.lampOff : COPY.lampOn}
      </span>
    </li>
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
  coachBrake = false,
  releaseBrake = false,
}: {
  run: RunState;
  shake: boolean;
  numbers: boolean;
  /** 第一次進站示範的第二拍：強調煞車。 */
  coachBrake?: boolean;
  /** 推了動力、煞車沒放、車不走：提示先放開煞車。 */
  releaseBrake?: boolean;
  onPower: (notch: number) => void;
  onBrake: (notch: number) => void;
  onHorn: () => void;
  onDoor: () => void;
}) {
  const station = run.stations[run.stationIndex];
  const limit = currentLimit(run);
  const zone = gaugeZone(run.speed, limit);
  const waiting = station != null && run.boarded < station.passengers.length;
  const doorLabel =
    run.phase === "doors-open"
      ? waiting
        ? COPY.boarding
        : COPY.closeDoors
      : COPY.openDoors;
  const doorReady =
    run.phase === "stopped" || (run.phase === "doors-open" && !waiting);
  const atStation = run.phase === "stopped" || run.phase === "doors-open";
  const tunnel = inTunnel(run);
  const simple = simpleLevers(run.course);
  // 鐵橋上，或停好後還沒跟地標打招呼（大司機、小站長）：喇叭亮黃圈。
  const hornHint = (onBridge(run) && !run.bridgeGreeted && run.phase === "running") || landmarkTaskPending(run);
  const flagLamp: LampState = run.autoBrake
    ? "orange"
    : run.speed <= 0.001
      ? "off"
      : zone === "green"
        ? "green"
        : "yellow";

  return (
    <div
      className={styles.cab}
      data-testid="orange-express-cab"
      data-tunnel={tunnel ? "true" : "false"}
      data-auto-brake={run.autoBrake ? "true" : "false"}
      data-simple={simple ? "true" : "false"}
    >
      {/* 站名、速度表、指示燈收在兩根桿中間那一格；不另佔一列，高度留給前窗。DOM 放最前，讀屏先聽到站名。 */}
      <div className={styles.dash}>
        <div className={styles.dashHead}>
          <XiaojuFace className={styles.badge} mood={xiaojuMood(run)} />
          <p className={styles.stationName}>
            <span className={styles.stationLead}>
              {station ? <LandmarkGlyph id={station.landmark} className={styles.stationLandmark} /> : null}
              {atStation ? COPY.atStation : COPY.nextStop}
            </span>
            {station ? (
              <span className={styles.stationPlate}>{station.name}</span>
            ) : null}
          </p>
        </div>
        <OrangeExpressGauge speed={run.speed} limit={limit} numbers={numbers} />
        {/* 低齡只留「門」「停車」：桿子自己限速，速度旗燈不會亮橘；車內燈是裝飾。省下一列給前窗。 */}
        <ul className={styles.lamps} aria-label={COPY.lampsLabel}>
          {simple ? null : (
            <Lamp
              label={COPY.lampFlag}
              state={flagLamp}
              icon={<FlagIcon />}
            />
          )}
          <Lamp
            label={COPY.lampDoor}
            state={run.phase === "doors-open" ? "orange" : "off"}
            icon={<DoorIcon />}
          />
          <Lamp
            label={COPY.lampStop}
            state={atStation ? "green" : "off"}
            icon={<StopIcon />}
          />
          {simple ? null : (
            <Lamp
              label={COPY.lampLight}
              state={tunnel ? "yellow" : "off"}
              icon={<LightIcon />}
            />
          )}
        </ul>
      </div>
      <Lever
        kind="power"
        notch={run.power}
        notches={powerNotches(run.course)}
        simple={simple}
        onChange={onPower}
      />
      <Lever
        kind="brake"
        notch={run.brake}
        notches={brakeNotches(run.course)}
        simple={simple}
        coach={coachBrake}
        release={releaseBrake}
        onChange={onBrake}
      />
      <div className={styles.cabBottom}>
        <button
          type="button"
          className={styles.horn}
          aria-label={COPY.horn}
          data-hint={hornHint ? "true" : "false"}
          data-testid="orange-express-horn"
          onClick={onHorn}
        >
          <HornIcon />
        </button>
        <button
          type="button"
          className={styles.door}
          data-shake={shake ? "true" : "false"}
          data-ready={doorReady ? "true" : "false"}
          aria-disabled={doorReady ? undefined : true}
          onClick={onDoor}
        >
          <DoorIcon />
          {doorLabel}
        </button>
      </div>
    </div>
  );
}
