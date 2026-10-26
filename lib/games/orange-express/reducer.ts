import { stationsFor, stopEpsilon } from "@/lib/games/orange-express/routes";
import {
  BRAKE_MAX,
  EMERGENCY,
  POWER_MAX,
  type BrakeNotch,
  type LevelId,
  type OrangeExpressHook,
  type PowerNotch,
  type RunAction,
  type RunState,
  type Station,
  type StopGrade,
} from "@/lib/games/orange-express/types";

/** 每秒加多少速度（速度是 0–1，不是公里）。 */
export const POWER_ACCEL = [0, 0.16, 0.28, 0.4, 0.52] as const;
/** 每秒減多少速度。最後一格是緊急。 */
export const BRAKE_ACCEL = [0, 0.22, 0.4, 0.6, 0.8, 1.6] as const;
/** 什麼都不推時，車自己慢慢變慢。 */
export const COAST_DRAG = 0.03;
export const BLEED = 0.8;
export const CRUISE_LIMIT = 0.82;
export const PROGRESS_RATE = 0.18;
export const DT_CAP = 0.1;
export const BOARD_STEP = 0.4;
/** 倒車每秒退多少進度。約兩到三秒退回窗前。 */
export const REVERSE_RATE = 0.16;
/** 倒車退到窗頭前面多少。 */
export const REVERSE_TO = 0.08;
/** 慢慢看在進站後至少保持這個速度，不會停在月台前面。 */
export const LOOK_CREEP = 0.08;
const GRADE_EPSILON = 1e-6;

function quant(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function powerCap(level: LevelId): PowerNotch {
  return level === "look" ? 2 : POWER_MAX;
}

export function clampPower(n: number, max: PowerNotch = POWER_MAX): PowerNotch {
  if (!Number.isFinite(n)) return 0;
  const next = Math.round(n);
  if (next <= 0) return 0;
  if (next >= max) return max;
  return next as PowerNotch;
}

export function clampBrake(n: number): BrakeNotch {
  if (!Number.isFinite(n)) return 0;
  const next = Math.round(n);
  if (next <= 0) return 0;
  if (next >= BRAKE_MAX) return BRAKE_MAX;
  return next as BrakeNotch;
}

export function currentStation(state: RunState): Station {
  return state.stations[state.stationIndex] ?? state.stations[0]!;
}

export function currentLimit(state: RunState): number {
  const station = currentStation(state);
  return state.progress >= station.approachAt ? station.approachLimit : CRUISE_LIMIT;
}

export function createRun(level: LevelId): RunState {
  return {
    level,
    stations: stationsFor(level),
    stationIndex: 0,
    phase: "running",
    power: level === "look" ? 1 : 0,
    brake: 0,
    speed: 0,
    progress: 0,
    boarded: 0,
    boardTimer: 0,
    misses: 0,
    grades: [],
  };
}

function inWindow(station: Station, progress: number): boolean {
  return progress >= station.window.start && progress <= station.window.end;
}

export function gradeFor(station: Station, progress: number): StopGrade {
  return Math.abs(progress - station.target) <= station.greenHalf + GRADE_EPSILON ? "green" : "yellow";
}

function withGrade(state: RunState, progress: number): readonly StopGrade[] {
  if (state.grades[state.stationIndex]) return state.grades;
  const next = state.grades.slice();
  next[state.stationIndex] = gradeFor(currentStation(state), progress);
  return next;
}

function stopHere(state: RunState, progress: number): RunState {
  return { ...state, progress, speed: 0, phase: "stopped", grades: withGrade(state, progress) };
}

/** 慢慢看進站後由小橘自己算煞車，目標是綠區中心。 */
function lookAssist(state: RunState, station: Station): number | null {
  if (state.level !== "look" || state.progress < station.approachAt) return null;
  const remaining = (station.target - state.progress) / PROGRESS_RATE;
  if (remaining <= 0.002) return -BRAKE_ACCEL[4];
  const needed = (state.speed * state.speed) / (2 * remaining);
  return -Math.min(BRAKE_ACCEL[4], needed);
}

/** 目前這一秒的加速度。煞車一拉，動力就斷開。 */
export function accelFor(state: RunState): number {
  const station = currentStation(state);
  const assist = lookAssist(state, station);
  if (assist !== null) return Math.min(assist, -BRAKE_ACCEL[state.brake]);
  if (state.brake > 0) return -BRAKE_ACCEL[state.brake];
  if (state.power > 0) return POWER_ACCEL[state.power];
  return -COAST_DRAG;
}

/**
 * 照現在的桿位，車會停在哪裡（這一站的 0–1）。
 * 還在加速或沒有減速時回傳 null，畫面就不畫預測點。
 */
export function predictStop(state: RunState): number | null {
  if (state.phase === "stopped" || state.phase === "doors-open") return state.progress;
  if (state.phase !== "running" && state.phase !== "in-window") return null;
  if (state.speed <= 0) return state.progress;
  const accel = accelFor(state);
  if (accel >= -COAST_DRAG) return null;
  const distance = ((state.speed * state.speed) / (2 * -accel)) * PROGRESS_RATE;
  return quant(Math.min(1.2, state.progress + distance));
}

/** 速度 0 又在窗裡，就當成已經停好。 */
export function normalizePhase(state: RunState): RunState {
  if (state.phase === "doors-open" || state.phase === "route-done" || state.phase === "reversing") {
    return state;
  }
  const station = currentStation(state);
  const epsilon = stopEpsilon(state.level);
  if (inWindow(station, state.progress) && state.speed <= epsilon) {
    if (state.phase === "stopped" && state.speed === 0) return state;
    return stopHere(state, state.progress);
  }
  if (inWindow(station, state.progress)) {
    if (state.phase === "in-window") return state;
    return { ...state, phase: "in-window" };
  }
  if (state.phase === "running") return state;
  return { ...state, phase: "running" };
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function withHook(state: RunState, hook: OrangeExpressHook | null | undefined): RunState {
  if (!hook) return state;
  const stationCount = state.stations.length;
  const stationIndex = Math.min(
    stationCount - 1,
    Math.max(0, Math.floor(finiteOr(hook.stationIndex, state.stationIndex))),
  );
  const progress = quant(Math.min(1, Math.max(0, finiteOr(hook.progress, state.progress))));
  const speed = quant(Math.max(0, finiteOr(hook.speed, state.speed)));
  const misses = Math.max(0, Math.floor(finiteOr(hook.misses, state.misses)));
  const power = clampPower(finiteOr(hook.power, state.power), powerCap(state.level));
  const brake = clampBrake(finiteOr(hook.brake, state.brake));
  const grades = stationIndex === state.stationIndex ? state.grades : state.grades.slice(0, stationIndex);
  return normalizePhase({
    ...state,
    stationIndex,
    progress,
    speed,
    misses,
    power,
    brake,
    grades,
    boarded: 0,
    boardTimer: 0,
    phase: "running",
  });
}

/** 喇叭不改狀態。回傳同一個物件，畫面才知道不用重畫邏輯。 */
export function honk(state: RunState): RunState {
  return state;
}

function applyMotion(state: RunState, dt: number): RunState {
  const station = currentStation(state);
  const epsilon = stopEpsilon(state.level);
  const limit = currentLimit(state);

  let speed = state.speed + accelFor(state) * dt;
  if (speed > limit) speed = Math.max(limit, speed - BLEED * dt);
  if (
    state.level === "look" &&
    state.progress >= station.approachAt &&
    state.progress < station.target - station.greenHalf / 2 &&
    state.brake < EMERGENCY &&
    speed < LOOK_CREEP
  ) {
    speed = LOOK_CREEP;
  }
  if (speed < 0) speed = 0;
  speed = quant(speed);

  const progress = quant(state.progress + ((state.speed + speed) / 2) * PROGRESS_RATE * dt);

  if (progress > station.window.end) {
    if (speed <= epsilon) return stopHere(state, station.window.end);
    return {
      ...state,
      progress: station.window.end,
      speed: 0,
      power: 0,
      phase: "reversing",
      misses: state.misses + 1,
      boarded: 0,
      boardTimer: 0,
    };
  }

  if (inWindow(station, progress) && speed <= epsilon) return stopHere(state, progress);
  if (inWindow(station, progress)) return { ...state, progress, speed, phase: "in-window" };
  return { ...state, progress, speed, phase: "running" };
}

function applyReverse(state: RunState, dt: number): RunState {
  const station = currentStation(state);
  const stopAt = quant(Math.max(0, station.window.start - REVERSE_TO));
  const progress = quant(Math.max(stopAt, state.progress - REVERSE_RATE * dt));
  if (progress <= stopAt) return { ...state, progress, speed: 0, phase: "running" };
  return { ...state, progress };
}

function unchanged(state: RunState, next: RunState): boolean {
  return (
    next.phase === state.phase &&
    next.power === state.power &&
    next.brake === state.brake &&
    next.speed === state.speed &&
    next.progress === state.progress &&
    next.boarded === state.boarded &&
    next.boardTimer === state.boardTimer &&
    next.misses === state.misses &&
    next.stationIndex === state.stationIndex &&
    next.grades === state.grades
  );
}

export function step(state: RunState, action: RunAction): RunState {
  if (action.type === "set-power") {
    const notch = clampPower(action.notch, powerCap(state.level));
    if (notch === state.power) return state;
    if (state.phase === "route-done" || state.phase === "reversing") return state;
    if (state.phase === "doors-open" && notch > state.power) return state;
    return { ...state, power: notch };
  }

  if (action.type === "set-brake") {
    const notch = clampBrake(action.notch);
    if (notch === state.brake || state.phase === "route-done") return state;
    return { ...state, brake: notch };
  }

  if (action.type === "open-doors") {
    if (state.phase !== "stopped") return state;
    return {
      ...state,
      phase: "doors-open",
      speed: 0,
      boarded: 0,
      boardTimer: 0,
    };
  }

  if (action.type === "close-doors") {
    if (state.phase !== "doors-open") return state;
    const station = currentStation(state);
    if (state.boarded < station.passengers.length) return state;
    if (state.stationIndex >= state.stations.length - 1) {
      return { ...state, phase: "route-done", speed: 0, power: 0, brake: 0 };
    }
    return {
      ...state,
      stationIndex: state.stationIndex + 1,
      phase: "running",
      progress: 0,
      speed: 0,
      boarded: 0,
      boardTimer: 0,
    };
  }

  const dt = Math.min(DT_CAP, Math.max(0, action.dt));
  if (dt === 0 || state.phase === "route-done") return state;

  if (state.phase === "doors-open") {
    const station = currentStation(state);
    let boardTimer = state.boardTimer + dt;
    let boarded = state.boarded;
    while (boarded < station.passengers.length && boardTimer >= BOARD_STEP) {
      boardTimer = quant(boardTimer - BOARD_STEP);
      boarded += 1;
    }
    const next = { ...state, boardTimer: quant(boardTimer), boarded };
    return unchanged(state, next) ? state : next;
  }

  if (state.phase === "stopped") return state;

  const next = state.phase === "reversing" ? applyReverse(state, dt) : applyMotion(state, dt);
  return unchanged(state, next) ? state : next;
}
