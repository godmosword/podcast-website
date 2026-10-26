"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { OrangeExpressGauge } from "@/components/games/OrangeExpressGauge";
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
import { currentLimit, inTunnel, onBridge, powerCap } from "@/lib/games/orange-express/reducer";
import {
  BRAKE_MAX,
  EMERGENCY,
  POWER_MAX,
  type BrakeNotch,
  type PowerNotch,
  type RunState,
} from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

function OrangeBadge() {
  return (
    <svg viewBox="0 0 64 64" className={styles.badge} aria-hidden>
      <rect
        x="6"
        y="18"
        width="52"
        height="30"
        rx="15"
        fill="rgb(255, 248, 236)"
        stroke="currentColor"
        strokeWidth="3"
      />
      <rect x="6" y="30" width="52" height="8" fill="rgb(255, 150, 70)" />
      <circle cx="24" cy="28" r="3" fill="currentColor" />
      <circle cx="40" cy="28" r="3" fill="currentColor" />
      <circle cx="18" cy="38" r="3" fill="rgb(255, 170, 180)" />
      <circle cx="46" cy="38" r="3" fill="rgb(255, 170, 180)" />
      <path
        d="M26 40c2 3 10 3 12 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function notchFromY(el: HTMLElement, clientY: number, max: number): number {
  const rect = el.getBoundingClientRect();
  const span = rect.height <= 0 ? 1 : rect.height;
  const t = Math.min(0.999, Math.max(0, (clientY - rect.top) / span));
  const row = Math.floor(t * (max + 1));
  return max - row;
}

type LeverKind = "power" | "brake";

function Lever({
  kind,
  notch,
  max,
  cap,
  onChange,
}: {
  kind: LeverKind;
  notch: number;
  max: number;
  cap: number;
  onChange: (notch: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const label = kind === "power" ? COPY.power : COPY.brake;
  const valueText =
    kind === "power"
      ? powerValueText(notch as PowerNotch)
      : brakeValueText(notch as BrakeNotch);
  const word =
    kind === "power"
      ? powerWord(notch as PowerNotch)
      : brakeWord(notch as BrakeNotch);
  const rows = Array.from({ length: max + 1 }, (_, i) => max - i);

  const move = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    onChange(notchFromY(el, clientY, max));
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
        role="slider"
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={notch}
        aria-valuetext={valueText}
        tabIndex={0}
        style={{ "--notches": max + 1, "--at": max - notch } as CSSProperties}
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
      >
        <span className={styles.leverSlot} aria-hidden />
        <span className={styles.leverHandle} aria-hidden>
          <span className={styles.leverGrip} />
        </span>
        <span className={styles.notchPlate} aria-hidden>
          {rows.map((n) => {
            const text =
              kind === "power"
                ? powerLampLabel(n as PowerNotch)
                : brakeLampLabel(n as BrakeNotch);
            return (
              <span
                key={n}
                className={styles.notchLamp}
                data-notch={n}
                data-on={n === notch && n > 0 ? "true" : "false"}
                data-locked={n > cap ? "true" : "false"}
                data-emergency={
                  kind === "brake" && n === EMERGENCY ? "true" : "false"
                }
              >
                {text}
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

function DoorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
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

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
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
}: {
  run: RunState;
  shake: boolean;
  numbers: boolean;
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
    >
      <div className={styles.cabTop}>
        <OrangeBadge />
        <p className={styles.stationName}>
          <span className={styles.stationLead}>
            {atStation ? COPY.atStation : COPY.nextStop}
          </span>
          {station ? (
            <span className={styles.stationPlate}>{station.name}</span>
          ) : null}
        </p>
        <ul className={styles.lamps} aria-label={COPY.lampsLabel}>
          <Lamp
            label={COPY.lampFlag}
            state={flagLamp}
            icon={<FlagIcon />}
          />
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
          <Lamp
            label={COPY.lampLight}
            state={tunnel ? "yellow" : "off"}
            icon={<LightIcon />}
          />
        </ul>
      </div>
      <Lever
        kind="power"
        notch={run.power}
        max={POWER_MAX}
        cap={powerCap(run.level)}
        onChange={onPower}
      />
      <div className={styles.dash}>
        <OrangeExpressGauge speed={run.speed} limit={limit} numbers={numbers} />
      </div>
      <Lever
        kind="brake"
        notch={run.brake}
        max={BRAKE_MAX}
        cap={BRAKE_MAX}
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
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 10v4h3l5 4V6L7 10z" fill="currentColor" />
            <path
              d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
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
