"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { OrangeExpressGauge } from "@/components/games/OrangeExpressGauge";
import { HornIcon, XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
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
import { sliderKeyTarget } from "@/lib/games/orange-express/lever";
import {
  brakeNotches,
  currentLimit,
  inTunnel,
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

/** 點或拖到桿上哪一格：回傳格子的索引（0 在最下面）。 */
function indexFromY(el: HTMLElement, clientY: number, last: number): number {
  const rect = el.getBoundingClientRect();
  const span = rect.height <= 0 ? 1 : rect.height;
  const t = Math.min(0.999, Math.max(0, (clientY - rect.top) / span));
  const row = Math.floor(t * (last + 1));
  return last - row;
}

type LeverKind = "power" | "brake";

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
  onChange,
}: {
  kind: LeverKind;
  notch: number;
  notches: readonly number[];
  /** 低齡桿面：格上畫圖示、常駐底色，字縮小放圖下，不寫 P／B 代碼。 */
  simple: boolean;
  /** 第一次進站示範的煞車強調：低齡亮「停」那一格，大司機與小站長亮整根桿。 */
  coach?: boolean;
  onChange: (notch: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
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

  const move = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    pick(indexFromY(el, clientY, last));
  };

  return (
    <div className={styles.leverColumn} data-kind={kind}>
      <span className={styles.leverTitle}>
        {label}
        <b
          className={styles.leverWord}
          data-testid={`orange-express-${kind}-word`}
        >
          {word}
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
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          move(event.clientY);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          move(event.clientY);
        }}
        onPointerUp={(event) => {
          dragging.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onKeyDown={(event) => {
          const next = sliderKeyTarget(event.key, index, last);
          if (next === null) return;
          // 焦點在這根桿上時 ↑↓ 只動這根（煞車桿按 ↑ 是加煞車），不要再讓整頁的鍵盤對應動動力桿。
          event.preventDefault();
          event.stopPropagation();
          pick(next);
        }}
      >
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
}: {
  run: RunState;
  shake: boolean;
  numbers: boolean;
  /** 第一次進站示範的第二拍：強調煞車。 */
  coachBrake?: boolean;
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
  const hornHint = onBridge(run) && !run.bridgeGreeted && run.phase === "running";
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
