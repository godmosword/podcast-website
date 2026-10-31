import {
  BRAKE_ACCEL,
  kickEffort,
  limitAt,
  lookAssist,
  motionStep,
  netAccel,
  quant,
  restEffort,
  targetEffort,
  type Motion,
} from "@/lib/games/orange-express/physics";
import { COURSE_RULES, courseFor, stationsFor, stopEpsilon } from "@/lib/games/orange-express/routes";
import { isSmoothStop } from "@/lib/games/orange-express/medals";
import {
  BRAKE_MAX,
  EMERGENCY,
  POWER_MAX,
  type BrakeNotch,
  type CourseId,
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

export {
  AUTO_BRAKE_DECEL,
  AUTO_BRAKE_MARGIN,
  BLEED,
  BRAKE_ACCEL,
  COAST_DRAG,
  CRUISE_LIMIT,
  LOOK_CREEP,
  POWER_ACCEL,
  PROGRESS_RATE,
  limitAt,
} from "@/lib/games/orange-express/physics";

export const DT_CAP = 0.1;
export const BOARD_STEP = 0.4;
/** 倒車每秒退多少進度。約兩到三秒退回窗前。 */
export const REVERSE_RATE = 0.16;
/** 倒車退到窗頭前面多少。 */
export const REVERSE_TO = 0.08;
/** 對向列車從遠方出現到車尾過去的秒數。 */
export const PASS_DURATION = 2.9;
const GRADE_EPSILON = 1e-6;
/** 停車預測的固定步長與上限（20 秒內沒停就不畫三角）。 */
export const PREDICT_DT = 1 / 30;
export const PREDICT_STEPS = 600;

const POWER_ALL: readonly PowerNotch[] = [0, 1, 2, 3, 4];
/** 慢慢看：P0–P2，小橘幫忙停，只開得到慢慢的。 */
const LOOK_POWERS: readonly PowerNotch[] = [0, 1, 2];
/** 小小司機：鬆、慢、快三格（P0／P2／P4）。最快仍被速度旗壓住，只是起步沒有 P1 那麼慢。 */
const LITTLE_POWERS: readonly PowerNotch[] = [0, 2, POWER_MAX];

/** 動力桿上排的格，跟規則組走（小小司機與大司機都是「自己開」，桿面不一樣）。 */
export function powerNotches(course: CourseId): readonly PowerNotch[] {
  if (course === "look") return LOOK_POWERS;
  if (course === "little") return LITTLE_POWERS;
  return POWER_ALL;
}

export function powerCap(course: CourseId): PowerNotch {
  const notches = powerNotches(course);
  return notches[notches.length - 1]!;
}

/** 低齡桿面（慢慢看、小小司機）：兩根桿各三格，格上畫圖示、寫字，不寫 P／B 代碼。 */
export function simpleLevers(course: CourseId): boolean {
  return course === "look" || course === "little";
}

/** 吸到最近的一格；等距時取小的（小小司機的 P1 吸到「鬆」、P3 吸到「慢」，不會一推就最快）。 */
function snapTo<T extends number>(notches: readonly T[], raw: number): T {
  let best = notches[0]!;
  for (const notch of notches) {
    if (Math.abs(notch - raw) < Math.abs(best - raw)) best = notch;
  }
  return best;
}

export function snapPower(course: CourseId, n: number): PowerNotch {
  return snapTo(powerNotches(course), clampPower(n));
}

/** 鍵盤 ↑↓ 照這一組有的格子走一格；dir 1 是多推一格。 */
export function stepPower(course: CourseId, from: number, dir: 1 | -1): PowerNotch {
  const notches = powerNotches(course);
  const index = notches.indexOf(snapPower(course, from));
  return notches[Math.min(notches.length - 1, Math.max(0, index + dir))]!;
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

/** 低齡的煞車桿只排三格：鬆、停（B3）、緊急。大司機與小站長六格都在。 */
const SIMPLE_BRAKES: readonly BrakeNotch[] = [0, 3, EMERGENCY];
const ALL_BRAKES: readonly BrakeNotch[] = [0, 1, 2, 3, 4, EMERGENCY];

export function brakeNotches(course: CourseId): readonly BrakeNotch[] {
  return simpleLevers(course) ? SIMPLE_BRAKES : ALL_BRAKES;
}

/** 吸到這一組有的最近一格；等距時取小的（低齡的 B4 吸到「停」，不會誤拉緊急）。 */
export function snapBrake(course: CourseId, n: number): BrakeNotch {
  return snapTo(brakeNotches(course), clampBrake(n));
}

/** 鍵盤 ←→ 照這一組有的格子走一格；dir 1 是多拉一格煞車。 */
export function stepBrake(course: CourseId, from: number, dir: 1 | -1): BrakeNotch {
  const notches = brakeNotches(course);
  const index = notches.indexOf(snapBrake(course, from));
  return notches[Math.min(notches.length - 1, Math.max(0, index + dir))]!;
}

export function currentStation(state: RunState): Station {
  return state.stations[state.stationIndex] ?? state.stations[0]!;
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
    ...restEffort(0),
    stopJerk: 0,
    smoothStops: 0,
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
    landmarkGreets: [],
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

/** 停好、倒車、出站：作用回到「車停著」（沒有動力，煞車就是桿位）。 */
function stopHere(state: RunState, progress: number, stopJerk = 0): RunState {
  const firstStop = state.grades[state.stationIndex] === undefined;
  const measuredJerk = quant(Math.max(0, stopJerk));
  const smoothStops =
    firstStop && isSmoothStop({ ...state, stopJerk: measuredJerk })
      ? state.smoothStops + 1
      : state.smoothStops;
  return {
    ...state,
    ...restEffort(state.brake),
    stopJerk: measuredJerk,
    smoothStops,
    progress,
    speed: 0,
    autoBrake: false,
    phase: "stopped",
    grades: withGrade(state, progress),
  };
}

/**
 * 桿位的目標加速度（作用都跟上之後）。煞車一拉，動力就斷開；自動輕煞時動力也斷開。
 * 實際每一幀用的是延遲後的作用，見 physics.ts 的 motionStep。
 */
export function accelFor(state: RunState): number {
  const station = currentStation(state);
  const assist = lookAssist(state.level, station, state.progress, state.speed);
  if (assist !== null) return Math.min(assist, -BRAKE_ACCEL[state.brake]);
  return netAccel(targetEffort(state));
}

function motionOf(state: RunState): Motion {
  return {
    course: state.course,
    level: state.level,
    station: currentStation(state),
    power: state.power,
    brake: state.brake,
    autoBrake: state.autoBrake,
    tractive: state.tractive,
    braking: state.braking,
    speed: state.speed,
    progress: state.progress,
    autoBrakeRule: COURSE_RULES[state.course].autoBrake,
  };
}

/**
 * 照現在的桿位，車會停在哪裡（這一站的 0–1）。
 * 用跟 reducer 同一個 motionStep、固定步長往前推（含作用延遲、速度旗、慢慢看爬行），停的判定也一樣：
 * 在區間裡慢到「算停住」就停在那；區間前就停住則停在那；會開過頭時照樣往後推，回傳窗尾後面的點（畫面顯示超過）。
 * 沒拉煞車（推動力、滑行、只有自動輕煞）或 20 秒內停不下來：null，不畫預測點。
 */
export function predictStop(state: RunState): number | null {
  if (state.phase === "stopped" || state.phase === "doors-open") return state.progress;
  if (state.phase !== "running" && state.phase !== "in-window") return null;
  if (state.speed <= 0) return state.progress;
  const station = currentStation(state);
  if (state.brake === 0 && lookAssist(state.level, station, state.progress, state.speed) === null) return null;
  const epsilon = stopEpsilon(state.course);
  let motion = motionOf(state);
  let overrun = false;
  for (let i = 0; i < PREDICT_STEPS; i += 1) {
    const next = motionStep(motion, PREDICT_DT);
    motion = { ...motion, ...next };
    if (!overrun && next.progress > station.window.end) {
      if (next.speed <= epsilon) return station.window.end;
      overrun = true;
    }
    if (overrun) {
      if (next.speed <= epsilon || next.progress >= 1.2) return quant(Math.min(1.2, next.progress));
    } else if (next.speed <= 0 || (inWindow(station, next.progress) && next.speed <= epsilon)) {
      return next.progress;
    }
  }
  return null;
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
  const power = snapPower(state.course, finiteOr(hook.power, state.power));
  const brake = snapBrake(state.course, finiteOr(hook.brake, state.brake));
  // 測試直接跳桿位時作用也直接到位，不用等延遲；沒給桿位就保留原本的作用。
  const leversGiven = hook.power !== undefined || hook.brake !== undefined;
  const effort = leversGiven
    ? targetEffort({ course: state.course, power, brake, autoBrake: false })
    : { tractive: state.tractive, braking: state.braking };
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
    ...effort,
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

/**
 * 大司機、小站長開門等人時，這一站還沒跟地標打招呼。
 * 停好還沒開門時不出：那時「開門」是唯一要按的，一次只做一件事；等朋友上車的空檔才打招呼。
 */
export function landmarkTaskPending(state: RunState): boolean {
  if (!COURSE_RULES[state.course].landmarkGreet) return false;
  if (state.phase !== "doors-open") return false;
  return !state.landmarkGreets.includes(state.stationIndex);
}

/**
 * 喇叭記一筆「打招呼」只有兩種時候：停好後跟這一站的地標（大司機、小站長），
 * 或在鐵橋上第一次按。其他時候回傳同一個物件。
 */
export function honk(state: RunState): RunState {
  if (landmarkTaskPending(state)) {
    return { ...state, landmarkGreets: [...state.landmarkGreets, state.stationIndex] };
  }
  if (state.bridgeGreeted || !onBridge(state)) return state;
  return { ...state, bridgeGreeted: true, bridgeGreets: state.bridgeGreets + 1 };
}

function applyMotion(state: RunState, dt: number): RunState {
  const station = currentStation(state);
  const epsilon = stopEpsilon(state.course);
  const motion = motionStep(motionOf(state), dt);
  const { speed, progress } = motion;
  const autoBrakeCount = state.autoBrakeCount + (motion.autoBrakeStarted ? 1 : 0);

  let passing = state.passing;
  let passedTrain = state.passedTrain;
  if (passing !== null) {
    passing = quant(passing + dt);
    if (passing >= PASS_DURATION) passing = null;
  } else if (!passedTrain && station.passAt !== null && progress >= station.passAt) {
    passing = 0;
    passedTrain = true;
  }

  const moved = {
    ...state,
    autoBrake: motion.autoBrake,
    autoBrakeCount,
    tractive: motion.tractive,
    braking: motion.braking,
    passing,
    passedTrain,
  };

  if (progress > station.window.end) {
    if (speed <= epsilon) return stopHere(moved, station.window.end, motion.deceleration);
    return {
      ...moved,
      ...restEffort(state.brake),
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

  if (inWindow(station, progress) && speed <= epsilon) {
    return stopHere(moved, progress, motion.deceleration);
  }
  if (inWindow(station, progress)) return { ...moved, progress, speed, phase: "in-window" };
  return { ...moved, progress, speed, phase: "running" };
}

function applyReverse(state: RunState, dt: number): RunState {
  const station = currentStation(state);
  const stopAt = quant(Math.max(0, station.window.start - REVERSE_TO));
  const progress = quant(Math.max(stopAt, state.progress - REVERSE_RATE * dt));
  if (progress <= stopAt) return { ...state, ...restEffort(state.brake), progress, speed: 0, phase: "running" };
  return { ...state, progress };
}

/** 換桿：桿位立刻變，實際作用先跳一點再慢慢跟上（見 physics.ts）。 */
function withLevers(state: RunState, patch: { power?: PowerNotch; brake?: BrakeNotch }): RunState {
  const next = { ...state, ...patch };
  return { ...next, ...kickEffort(state, state, next) };
}

function unchanged(state: RunState, next: RunState): boolean {
  return (
    next.phase === state.phase &&
    next.power === state.power &&
    next.brake === state.brake &&
    next.tractive === state.tractive &&
    next.braking === state.braking &&
    next.speed === state.speed &&
    next.progress === state.progress &&
    next.boarded === state.boarded &&
    next.boardTimer === state.boardTimer &&
    next.misses === state.misses &&
    next.stopJerk === state.stopJerk &&
    next.smoothStops === state.smoothStops &&
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
    const notch = snapPower(state.course, action.notch);
    if (notch === state.power) return state;
    if (state.phase === "route-done" || state.phase === "reversing") return state;
    if (state.phase === "doors-open" && notch > state.power) return state;
    return withLevers(state, { power: notch });
  }

  if (action.type === "set-brake") {
    const notch = snapBrake(state.course, action.notch);
    if (notch === state.brake || state.phase === "route-done") return state;
    return withLevers(state, { brake: notch });
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
      return { ...state, ...restEffort(0), phase: "route-done", speed: 0, power: 0, brake: 0 };
    }
    return {
      ...state,
      ...restEffort(state.brake),
      stationIndex: state.stationIndex + 1,
      phase: "running",
      progress: 0,
      speed: 0,
      stopJerk: 0,
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
