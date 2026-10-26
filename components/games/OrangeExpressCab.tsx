"use client";

import { useRef } from "react";
import {
  brakeValueText,
  COPY,
  powerValueText,
} from "@/lib/games/orange-express/copy";
import {
  CRUISE_LIMIT,
  currentLimit,
  powerCap,
  speedMeter,
} from "@/lib/games/orange-express/reducer";
import type { Notch, RunState } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

function OrangeBadge() {
  return (
    <svg viewBox="0 0 64 64" className={styles.badge} aria-hidden>
      <rect x="6" y="18" width="52" height="30" rx="15" fill="rgb(255, 248, 236)" stroke="currentColor" strokeWidth="3" />
      <rect x="6" y="30" width="52" height="8" fill="rgb(255, 150, 70)" />
      <circle cx="24" cy="28" r="3" fill="currentColor" />
      <circle cx="40" cy="28" r="3" fill="currentColor" />
      <circle cx="18" cy="38" r="3" fill="rgb(255, 170, 180)" />
      <circle cx="46" cy="38" r="3" fill="rgb(255, 170, 180)" />
      <path d="M26 40c2 3 10 3 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function notchFromY(el: HTMLElement, clientY: number, max: Notch): Notch {
  const rect = el.getBoundingClientRect();
  const span = rect.height <= 0 ? 1 : rect.height;
  const t = Math.min(1, Math.max(0, (clientY - rect.top) / span));
  const raw = Math.round((1 - t) * max);
  if (raw <= 0) return 0;
  if (raw >= max) return max;
  return raw as Notch;
}

function Lever({
  label,
  notch,
  max,
  valueText,
  className,
  onChange,
}: {
  label: string;
  notch: Notch;
  max: Notch;
  valueText: string;
  className?: string;
  onChange: (notch: Notch) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const move = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    onChange(notchFromY(el, clientY, max));
  };

  return (
    <div
      ref={ref}
      className={className ? `${styles.lever} ${className}` : styles.lever}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={notch}
      aria-valuetext={valueText}
      tabIndex={0}
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
      <span className={styles.leverWord}>{label === COPY.brake ? COPY.stopWord : COPY.fastWord}</span>
      <span className={styles.leverTrack} aria-hidden>
        <span
          className={styles.leverKnob}
          style={{ top: `${max === 0 ? 0 : ((max - notch) / max) * 100}%` }}
        />
      </span>
      <span className={styles.leverWord}>{label === COPY.brake ? COPY.looseWord : COPY.stopWord}</span>
    </div>
  );
}

export function OrangeExpressCab({
  run,
  shake,
  onPower,
  onBrake,
  onHorn,
  onDoor,
}: {
  run: RunState;
  shake: boolean;
  onPower: (notch: Notch) => void;
  onBrake: (notch: Notch) => void;
  onHorn: () => void;
  onDoor: () => void;
}) {
  const station = run.stations[run.stationIndex];
  const limit = currentLimit(run);
  const meter = speedMeter(run.speed, limit);
  const flag = Math.min(100, Math.max(8, (limit / CRUISE_LIMIT) * 100));
  const bead = Math.min(flag, (Math.min(run.speed, limit) / CRUISE_LIMIT) * 100);
  const waiting = station != null && run.boarded < station.passengers.length;
  const doorLabel =
    run.phase === "doors-open" ? (waiting ? COPY.boarding : COPY.closeDoors) : COPY.openDoors;
  const doorReady =
    run.phase === "stopped" || (run.phase === "doors-open" && !waiting);

  return (
    <div className={styles.cab}>
      <div className={styles.cabTop}>
        <OrangeBadge />
        <p className={styles.stationName}>
          {run.phase === "stopped" || run.phase === "doors-open" ? COPY.atStation : COPY.nextStop}
          {station ? ` ${station.name}` : ""}
        </p>
      </div>
      <div
        className={styles.meter}
        role="meter"
        aria-label={COPY.speedFlag}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={meter.now}
        aria-valuetext={meter.text}
        data-hot={meter.now >= 100 ? "true" : "false"}
      >
        <span className={styles.flag} style={{ left: `${flag}%` }} aria-hidden />
        <span className={styles.bead} style={{ left: `${bead}%` }} aria-hidden />
      </div>
      <div className={styles.meterWords} aria-hidden>
        <span>{COPY.stopWord}</span>
        <span>{COPY.slowWord}</span>
        <span>{COPY.fastWord}</span>
      </div>
      <div className={styles.controls}>
        <Lever
          label={COPY.power}
          notch={run.power}
          max={powerCap(run.level)}
          valueText={powerValueText(run.power)}
          onChange={onPower}
        />
        <button type="button" className={styles.horn} aria-label={COPY.horn} onClick={onHorn}>
          嘟
        </button>
        <Lever
          label={COPY.brake}
          notch={run.brake}
          max={2}
          valueText={brakeValueText(run.brake)}
          className={styles.brake}
          onChange={onBrake}
        />
        <button
          type="button"
          className={styles.door}
          data-shake={shake ? "true" : "false"}
          aria-disabled={doorReady ? undefined : true}
          onClick={onDoor}
        >
          {doorLabel}
        </button>
      </div>
    </div>
  );
}
