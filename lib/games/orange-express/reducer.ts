import { COURSE_RULES, courseFor, stationsFor, stopEpsilon } from "@/lib/games/orange-express/routes";
import {
  BRAKE_MAX,
  EMERGENCY,
  POWER_MAX,
  type BrakeNotch,
  type DriverId,
  type LevelId,
  type OrangeExpressHook,
  type PointTask,
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
/** 沒有自動輕煞的規則組：高出速度旗的部分用這個速率收回。 */
export const BLEED = 0.8;
export const CRUISE_LIMIT = 0.82;
export const PROGRESS_RATE = 0.18;
export const DT_CAP = 0.1;
export const BOARD_STEP = 0.4;
/** 倒車每秒退多少進度。約兩到三秒退回窗前。 */
export const REVERSE_RATE = 0.16;
/** 倒車退到窗頭前面多少。 */
export const REVERSE_TO = 0.08;
/**
 * 慢慢看在進站後至少保持這個速度，不會停在月台前面。
 * 必須大於慢慢看的「算停住」門檻（stopEpsilon("look")），不然一拉煞車就在區間最前面（黃區）停下。
 */
export const LOOK_CREEP = 0.1;
/** 自動輕煞的減速度，約等於 B2。 */
export const AUTO_BRAKE_DECEL = 0.4;
/** 超過速度旗這麼多才算超速，避免在旗子上下抖。 */
export const AUTO_BRAKE_MARGIN = 0.01;
/** 對向列車從遠方出現到車尾過去的秒數。 */
export const PASS_DURATION = 2.9;
const GRADE_EPSILON = 1e-6;

function quant(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function powerCap(level: LevelId): PowerNotch {
  return level === "look" ? 2 : POWER_MAX;
}

const POWER_ALL: readonly PowerNotch[] = [0, 1, 2, 3, 4];

/** 動力桿上排的格：0 到這一檔的上限。 */
export function powerNotches(level: LevelId): readonly PowerNotch[] {
  return POWER_ALL.slice(0, powerCap(level) + 1);
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

/** 慢慢看的煞車桿只排三格：鬆、停（B3）、緊急。其他檔六格都在。 */
const LOOK_BRAKES: readonly BrakeNotch[] = [0, 3, EMERGENCY];
const ALL_BRAKES: readonly BrakeNotch[] = [0, 1, 2, 3, 4, EMERGENCY];

export function brakeNotches(level: LevelId): readonly BrakeNotch[] {
  return level === "look" ? LOOK_BRAKES : ALL_BRAKES;
}

/** 吸到這一檔有的最近一格；等距時取小的（慢慢看的 B4 吸到「停」，不會誤拉緊急）。 */
export function snapBrake(level: LevelId, n: number): BrakeNotch {
  const raw = clampBrake(n);
  const notches = brakeNotches(level);
  let best = notches[0]!;
  for (const notch of notches) {
    if (Math.abs(notch - raw) < Math.abs(best - raw)) best = notch;
  }
  return best;
}

/** 鍵盤 ←→ 照這一檔有的格子走一格；dir 1 是多拉一格煞車。 */
export function stepBrake(level: LevelId, from: number, dir: 1 | -1): BrakeNotch {
  const notches = brakeNotches(level);
  const index = notches.indexOf(snapBrake(level, from));
  return notches[Math.min(notches.length - 1, Math.max(0, index + dir))]!;
}

export function currentStation(state: RunState): Station {
  return state.stations[state.stationIndex] ?? state.stations[0]!;
}

/** 速度旗：路上看最後經過的速限牌，進站後不高於進站旗。 */
export function limitAt(station: Station, progress: number): number {
  let limit = CRUISE_LIMIT;
  for (const sign of station.signs) {
    if (progress >= sign.at) limit = sign.limit;
  }
  if (progress >= station.approachAt) limit = Math.min(limit, station.approachLimit);
  return limit;
}

export function currentLimit(state: RunState): number {
  return limitAt(currentStation(state), state.progress);
}

/** 前面最近、還沒經過的速限牌（給前窗的提示用）。 */
export function nextSign(state: RunState, ahead = 0.08): { at: number; limit: number } | null {
  const station = currentStation(state);
  for (const sign of station.signs) {
    if (sign.at > state.progress && sign.at - state.progress <= ahead) return sign;
  }
  return null;
}

export function inTunnel(state: RunState): boolean {
  const tunnel = currentStation(state).tunnel;
  return tunnel !== null && state.progress >= tunnel.from && state.progress <= tunnel.to;
}

export function onBridge(state: RunState): boolean {
  const bridge = currentStation(state).bridge;
  return bridge !== null && state.progress >= bridge.from && state.progress <= bridge.to;
}

/** 現在可以做的指差確認。倒車、開門、到終點時不出題。 */
export function pendingPoint(state: RunState): PointTask | null {
  if (state.phase === "reversing" || state.phase === "doors-open" || state.phase === "route-done") {
    return null;
  }
  for (const task of currentStation(state).points) {
    if (state.pointsDone.includes(task.id)) continue;
    if (state.progress >= task.at && state.progress <= task.until) return task;
  }
  return null;
}

export function pointTotal(state: RunState): number {
  return state.stations.reduce((sum, station) => sum + station.points.length, 0);
}

export function createRun(level: LevelId, driver: DriverId = "big"): RunState {
  return {
    level,
    course: courseFor(level, driver),
    stations: stationsFor(level, driver),
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
    autoBrake: false,
    autoBrakeCount: 0,
    passing: null,
    passedTrain: false,
    bridgeGreeted: false,
    bridgeGreets: 0,
    pointsDone: [],
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
  return { ...state, progress, speed: 0, autoBrake: false, phase: "stopped", grades: withGrade(state, progress) };
}

/** 慢慢看進站後由小橘自己算煞車，目標是綠區中心。 */
function lookAssist(state: RunState, station: Station): number | null {
  if (state.level !== "look" || state.progress < station.approachAt) return null;
  const remaining = (station.target - state.progress) / PROGRESS_RATE;
  if (remaining <= 0.002) return -BRAKE_ACCEL[4];
  const needed = (state.speed * state.speed) / (2 * remaining);
  return -Math.min(BRAKE_ACCEL[4], needed);
}

/** 目前這一秒的加速度。煞車一拉，動力就斷開；自動輕煞時動力也斷開。 */
export function accelFor(state: RunState): number {
  const station = currentStation(state);
  const assist = lookAssist(state, station);
  if (assist !== null) return Math.min(assist, -BRAKE_ACCEL[state.brake]);
  if (state.autoBrake) return -Math.max(AUTO_BRAKE_DECEL, BRAKE_ACCEL[state.brake]);
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
  let stop = state.progress + distance;
  // 慢慢看進站後車會爬到爬行區尾端才放開，再用同樣的減速度停下；三角要畫在那裡，不然會指在黃區。
  const station = currentStation(state);
  const creepEnd = station.target - station.greenHalf / 2;
  if (
    state.level === "look" &&
    state.brake < EMERGENCY &&
    state.progress >= station.approachAt &&
    state.progress < creepEnd &&
    stop < creepEnd
  ) {
    stop = creepEnd + ((LOOK_CREEP * LOOK_CREEP) / (2 * -accel)) * PROGRESS_RATE;
  }
  return quant(Math.min(1.2, stop));
}

/** 速度 0 又在窗裡，就當成已經停好。 */
export function normalizePhase(state: RunState): RunState {
  if (state.phase === "doors-open" || state.phase === "route-done" || state.phase === "reversing") {
    return state;
  }
  const station = currentStation(state);
  const epsilon = stopEpsilon(state.course);
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
  const brake = snapBrake(state.level, finiteOr(hook.brake, state.brake));
  const sameStation = stationIndex === state.stationIndex;
  const grades = sameStation ? state.grades : state.grades.slice(0, stationIndex);
  const passing =
    typeof hook.passing === "number" && Number.isFinite(hook.passing)
      ? quant(Math.min(PASS_DURATION, Math.max(0, hook.passing)))
      : sameStation
        ? state.passing
        : null;
  return normalizePhase({
    ...state,
    stationIndex,
    progress,
    speed,
    misses,
    power,
    brake,
    grades,
    passing,
    passedTrain: passing !== null || (sameStation && state.passedTrain),
    bridgeGreeted: sameStation && state.bridgeGreeted,
    autoBrake: false,
    boarded: 0,
    boardTimer: 0,
    phase: "running",
  });
}

/** 喇叭只有在鐵橋上第一次按才記一筆「打招呼」；其他時候回傳同一個物件。 */
export function honk(state: RunState): RunState {
  if (state.bridgeGreeted || !onBridge(state)) return state;
  return { ...state, bridgeGreeted: true, bridgeGreets: state.bridgeGreets + 1 };
}

function applyMotion(state: RunState, dt: number): RunState {
  const station = currentStation(state);
  const rules = COURSE_RULES[state.course];
  const epsilon = stopEpsilon(state.course);
  const limit = currentLimit(state);

  let autoBrake = state.autoBrake;
  let autoBrakeCount = state.autoBrakeCount;
  if (rules.autoBrake && !autoBrake && state.speed > limit + AUTO_BRAKE_MARGIN) {
    autoBrake = true;
    autoBrakeCount += 1;
  }

  let speed = state.speed + accelFor({ ...state, autoBrake }) * dt;
  if (autoBrake) {
    if (speed <= limit) {
      autoBrake = false;
      speed = Math.min(speed, limit);
    }
  } else if (speed > limit) {
    // 桿子推不過速度旗；沒有自動輕煞的規則組，旗子降下來時也安靜地收回。
    speed = state.speed <= limit + AUTO_BRAKE_MARGIN ? limit : Math.max(limit, speed - BLEED * dt);
  }
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

  let passing = state.passing;
  let passedTrain = state.passedTrain;
  if (passing !== null) {
    passing = quant(passing + dt);
    if (passing >= PASS_DURATION) passing = null;
  } else if (!passedTrain && station.passAt !== null && progress >= station.passAt) {
    passing = 0;
    passedTrain = true;
  }

  const moved = { ...state, autoBrake, autoBrakeCount, passing, passedTrain };

  if (progress > station.window.end) {
    if (speed <= epsilon) return stopHere(moved, station.window.end);
    return {
      ...moved,
      progress: station.window.end,
      speed: 0,
      power: 0,
      autoBrake: false,
      phase: "reversing",
      misses: state.misses + 1,
      boarded: 0,
      boardTimer: 0,
    };
  }

  if (inWindow(station, progress) && speed <= epsilon) return stopHere(moved, progress);
  if (inWindow(station, progress)) return { ...moved, progress, speed, phase: "in-window" };
  return { ...moved, progress, speed, phase: "running" };
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
    next.grades === state.grades &&
    next.autoBrake === state.autoBrake &&
    next.autoBrakeCount === state.autoBrakeCount &&
    next.passing === state.passing &&
    next.passedTrain === state.passedTrain
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
    const notch = snapBrake(state.level, action.notch);
    if (notch === state.brake || state.phase === "route-done") return state;
    return { ...state, brake: notch };
  }

  if (action.type === "honk") return honk(state);

  if (action.type === "point") {
    const task = pendingPoint(state);
    if (!task) return state;
    return { ...state, pointsDone: [...state.pointsDone, task.id] };
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
      autoBrake: false,
      passing: null,
      passedTrain: false,
      bridgeGreeted: false,
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
