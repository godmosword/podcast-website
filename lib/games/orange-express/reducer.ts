import { stationsFor, stopEpsilon } from "@/lib/games/orange-express/routes";
import type {
  LevelId,
  Notch,
  OrangeExpressHook,
  RunAction,
  RunState,
  Station,
} from "@/lib/games/orange-express/types";

export const POWER_ACCEL = [0, 0.55, 1.05] as const;
export const BRAKE_ACCEL = [0, 0.7, 1.4] as const;
export const BLEED = 0.8;
export const CRUISE_LIMIT = 0.82;
export const PROGRESS_RATE = 0.22;
export const DT_CAP = 0.1;
export const LOOK_ASSIST = 1.2;
export const BOARD_STEP = 0.4;
export const MISS_REWIND = 0.18;

function quant(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function powerCap(level: LevelId): Notch {
  return level === "look" ? 1 : 2;
}

export function clampNotch(n: number, max: Notch): Notch {
  const next = Math.round(n);
  if (next <= 0) return 0;
  if (next >= max) return max;
  return next as Notch;
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
  };
}

function inWindow(station: Station, progress: number): boolean {
  return progress >= station.window.start && progress <= station.window.end;
}

/** 速度 0 又在窗裡，就當成已經停好。 */
export function normalizePhase(state: RunState): RunState {
  if (state.phase === "doors-open" || state.phase === "route-done") return state;
  const station = currentStation(state);
  const epsilon = stopEpsilon(state.level);
  if (inWindow(station, state.progress) && state.speed <= epsilon) {
    if (state.phase === "stopped" && state.speed === 0) return state;
    return { ...state, speed: 0, phase: "stopped" };
  }
  if (inWindow(station, state.progress)) {
    if (state.phase === "in-window") return state;
    return { ...state, phase: "in-window" };
  }
  if (state.phase === "running") return state;
  return { ...state, phase: "running" };
}

export function withHook(state: RunState, hook: OrangeExpressHook | null | undefined): RunState {
  if (!hook) return state;
  const stationCount = state.stations.length;
  let stationIndex = state.stationIndex;
  if (typeof hook.stationIndex === "number" && Number.isFinite(hook.stationIndex)) {
    stationIndex = Math.min(stationCount - 1, Math.max(0, Math.floor(hook.stationIndex)));
  }
  const progress =
    typeof hook.progress === "number" && Number.isFinite(hook.progress)
      ? quant(Math.min(1, Math.max(0, hook.progress)))
      : state.progress;
  const speed =
    typeof hook.speed === "number" && Number.isFinite(hook.speed)
      ? quant(Math.max(0, hook.speed))
      : state.speed;
  const misses =
    typeof hook.misses === "number" && Number.isFinite(hook.misses)
      ? Math.max(0, Math.floor(hook.misses))
      : state.misses;
  return normalizePhase({
    ...state,
    stationIndex,
    progress,
    speed,
    misses,
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
  const limit = state.progress >= station.approachAt ? station.approachLimit : CRUISE_LIMIT;
  const inside = inWindow(station, state.progress);
  let accel = POWER_ACCEL[state.power] - BRAKE_ACCEL[state.brake];
  if (state.level === "look" && inside) accel -= LOOK_ASSIST;

  let speed = state.speed + accel * dt;
  if (speed > limit) speed = Math.max(limit, speed - BLEED * dt);
  if (speed < 0) speed = 0;
  speed = quant(speed);

  const progress = quant(state.progress + state.speed * PROGRESS_RATE * dt);

  if (progress > station.window.end) {
    if (speed <= epsilon) {
      return { ...state, progress: station.window.end, speed: 0, phase: "stopped" };
    }
    return {
      ...state,
      progress: quant(Math.max(0, station.window.start - MISS_REWIND)),
      speed,
      phase: "running",
      misses: state.misses + 1,
      boarded: 0,
      boardTimer: 0,
    };
  }

  if (inWindow(station, progress) && speed <= epsilon) {
    return { ...state, progress, speed: 0, phase: "stopped" };
  }
  if (inWindow(station, progress)) {
    return { ...state, progress, speed, phase: "in-window" };
  }
  return { ...state, progress, speed, phase: "running" };
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
    next.stationIndex === state.stationIndex
  );
}

export function step(state: RunState, action: RunAction): RunState {
  if (action.type === "set-power") {
    const notch = clampNotch(action.notch, powerCap(state.level));
    if (notch === state.power) return state;
    if (state.phase === "route-done") return state;
    if (state.phase === "doors-open" && notch > state.power) return state;
    return { ...state, power: notch };
  }

  if (action.type === "set-brake") {
    const notch = clampNotch(action.notch, 2);
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

  const next = applyMotion(state, dt);
  return unchanged(state, next) ? state : next;
}

export function speedMeter(speed: number, limit: number): { now: number; text: "到速度旗了" | "還可以再快" } {
  const safe = limit > 0 ? limit : 1;
  const now = Math.max(0, Math.min(100, Math.round((Math.min(Math.max(0, speed), safe) / safe) * 100)));
  return { now, text: now >= 100 ? "到速度旗了" : "還可以再快" };
}
