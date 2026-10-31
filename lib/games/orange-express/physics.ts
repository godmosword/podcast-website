import {
  EMERGENCY,
  type BrakeNotch,
  type CourseId,
  type LevelId,
  type PowerNotch,
  type Station,
} from "@/lib/games/orange-express/types";

/**
 * 小橘特快車的運動：桿位 → 實際作用（動力、煞車）→ 速度 → 進度。
 * 只有純函式，reducer 每一幀與停車預測共用同一個單步 `motionStep`，預測才會跟真的停點一樣。
 */

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
/**
 * 慢慢看在進站後至少保持這個速度，不會停在月台前面。
 * 必須大於慢慢看的「算停住」門檻（stopEpsilon("look")），不然一拉煞車就在區間最前面（黃區）停下。
 */
export const LOOK_CREEP = 0.1;
/** 自動輕煞的減速度，約等於 B2。 */
export const AUTO_BRAKE_DECEL = 0.4;
/** 超過速度旗這麼多才算超速，避免在旗子上下抖。 */
export const AUTO_BRAKE_MARGIN = 0.01;

/**
 * 桿位變了，實際作用要多久才跟上（一階延遲的時間常數，秒）。列車有重量：推了動力不會瞬間全力。
 * 慢慢看全部 0（小橘幫忙開，桿位就是作用）；越大的司機越有重量感。煞車上升不慢於動力，停車不會變難。
 * 全部調成 0 就退回「桿位就是作用」。
 */
export type EffortLag = { power: number; brakeRise: number; brakeRelease: number };

export const EFFORT_LAG: Record<CourseId, EffortLag> = {
  look: { power: 0, brakeRise: 0, brakeRelease: 0 },
  little: { power: 0.2, brakeRise: 0.15, brakeRelease: 0.15 },
  big: { power: 0.45, brakeRise: 0.3, brakeRelease: 0.2 },
  captain: { power: 0.6, brakeRise: 0.4, brakeRelease: 0.25 },
};

/** 桿位一變，作用先跳到目標的這麼多（沒有「推了沒反應」的空檔），剩下用延遲補上。 */
export const EFFORT_KICK = 0.35;
/** 離目標這麼近就直接等於目標，不拖一條永遠到不了的尾巴。 */
const EFFORT_SNAP = 1e-4;

export function quant(n: number): number {
  return Math.round(n * 1e6) / 1e6;
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

/** 動力的目標作用。煞車一拉或自動輕煞時動力斷開（是開關，不延遲）。 */
export function tractiveTarget(power: PowerNotch, brake: BrakeNotch, autoBrake: boolean): number {
  return brake > 0 || autoBrake ? 0 : POWER_ACCEL[power];
}

/** 煞車的目標作用。自動輕煞至少是 AUTO_BRAKE_DECEL。 */
export function brakingTarget(brake: BrakeNotch, autoBrake: boolean): number {
  const decel = BRAKE_ACCEL[brake];
  return autoBrake ? Math.max(AUTO_BRAKE_DECEL, decel) : decel;
}

function approach(from: number, to: number, tau: number, dt: number): number {
  if (tau <= 0 || dt <= 0) return tau <= 0 ? to : from;
  const next = to + (from - to) * Math.exp(-dt / tau);
  return Math.abs(next - to) < EFFORT_SNAP ? to : quant(next);
}

/** 桿位剛變的那一刻：先往目標跳 EFFORT_KICK。 */
function kick(from: number, to: number, tau: number): number {
  if (tau <= 0) return to;
  const next = from + (to - from) * EFFORT_KICK;
  return Math.abs(next - to) < EFFORT_SNAP ? to : quant(next);
}

export type Levers = {
  course: CourseId;
  power: PowerNotch;
  brake: BrakeNotch;
  autoBrake: boolean;
};

export type Effort = { tractive: number; braking: number };

/** 車停著（剛開局、停好、倒車、出站）：沒有動力，煞車就是桿位。 */
export function restEffort(brake: BrakeNotch): Effort {
  return { tractive: 0, braking: BRAKE_ACCEL[brake] };
}

/** 作用直接等於桿位的目標（測試的 jump、慢慢看）。 */
export function targetEffort(levers: Levers): Effort {
  return {
    tractive: tractiveTarget(levers.power, levers.brake, levers.autoBrake),
    braking: brakingTarget(levers.brake, levers.autoBrake),
  };
}

/**
 * 換桿那一刻的作用：目標有變的那一個先跳 EFFORT_KICK。
 * 煞車一拉動力立刻斷；緊急煞車立刻全力。
 */
export function kickEffort(effort: Effort, prev: Levers, next: Levers): Effort {
  const lag = EFFORT_LAG[next.course];
  const tractiveTo = tractiveTarget(next.power, next.brake, next.autoBrake);
  const brakingTo = brakingTarget(next.brake, next.autoBrake);
  const tractiveFrom = tractiveTarget(prev.power, prev.brake, prev.autoBrake);
  const brakingFrom = brakingTarget(prev.brake, prev.autoBrake);
  let tractive = effort.tractive;
  if (tractiveTo === 0 && (next.brake > 0 || next.autoBrake)) tractive = 0;
  else if (tractiveTo !== tractiveFrom) tractive = kick(effort.tractive, tractiveTo, lag.power);
  let braking = effort.braking;
  if (next.brake === EMERGENCY) braking = brakingTo;
  else if (brakingTo !== brakingFrom) {
    braking = kick(effort.braking, brakingTo, brakingTo > effort.braking ? lag.brakeRise : lag.brakeRelease);
  }
  return { tractive, braking };
}

/** 每一幀作用往目標靠。 */
function settleEffort(effort: Effort, levers: Levers, dt: number): Effort {
  const lag = EFFORT_LAG[levers.course];
  const tractiveTo = tractiveTarget(levers.power, levers.brake, levers.autoBrake);
  const brakingTo = brakingTarget(levers.brake, levers.autoBrake);
  const tractive =
    tractiveTo === 0 && (levers.brake > 0 || levers.autoBrake)
      ? 0
      : approach(effort.tractive, tractiveTo, lag.power, dt);
  let braking: number;
  if (levers.brake === EMERGENCY) braking = brakingTo;
  else {
    braking = approach(effort.braking, brakingTo, brakingTo > effort.braking ? lag.brakeRise : lag.brakeRelease, dt);
    // 自動輕煞是小橘幫忙踩的，立刻作用。
    if (levers.autoBrake) braking = Math.max(braking, AUTO_BRAKE_DECEL);
  }
  return { tractive, braking };
}

/** 實際作用合起來的加速度。動力還在時不算滑行阻力（跟原本一樣）。 */
export function netAccel(effort: Effort): number {
  if (effort.tractive > 0) return effort.tractive - effort.braking;
  return -Math.max(effort.braking, COAST_DRAG);
}

/** 慢慢看進站後由小橘自己算煞車，目標是綠區中心。 */
export function lookAssist(level: LevelId, station: Station, progress: number, speed: number): number | null {
  if (level !== "look" || progress < station.approachAt) return null;
  const remaining = (station.target - progress) / PROGRESS_RATE;
  if (remaining <= 0.002) return -BRAKE_ACCEL[4];
  const needed = (speed * speed) / (2 * remaining);
  return -Math.min(BRAKE_ACCEL[4], needed);
}

export type Motion = Levers &
  Effort & {
    level: LevelId;
    station: Station;
    speed: number;
    progress: number;
    /** 這一規則組會不會自動輕煞（大司機、小站長）。 */
    autoBrakeRule: boolean;
  };

export type MotionResult = Effort & {
  speed: number;
  progress: number;
  /** 速度旗、速度下限等處理前，實際使用的減速度。 */
  deceleration: number;
  autoBrake: boolean;
  /** 這一步剛觸發自動輕煞（reducer 拿來數次數、響叮叮）。 */
  autoBrakeStarted: boolean;
};

/**
 * 往前走一步：作用往目標靠 → 加速度 → 速度（速度旗、自動輕煞、慢慢看爬行）→ 進度。
 * 不碰站、門、倒車、對向列車；那些留在 reducer。
 */
export function motionStep(m: Motion, dt: number): MotionResult {
  const limit = limitAt(m.station, m.progress);
  let autoBrake = m.autoBrake;
  let autoBrakeStarted = false;
  if (m.autoBrakeRule && !autoBrake && m.speed > limit + AUTO_BRAKE_MARGIN) {
    autoBrake = true;
    autoBrakeStarted = true;
  }

  const levers: Levers = { course: m.course, power: m.power, brake: m.brake, autoBrake };
  const settled = settleEffort(m, levers, dt);
  const tractive = settled.tractive;
  let braking = settled.braking;

  const assist = lookAssist(m.level, m.station, m.progress, m.speed);
  const accel = assist !== null ? Math.min(assist, -braking) : netAccel({ tractive, braking });
  let speed = m.speed + accel * dt;
  if (autoBrake) {
    if (speed <= limit) {
      autoBrake = false;
      speed = Math.min(speed, limit);
      // 小橘放開輕煞也是立刻的；動力從 0 慢慢回來。
      braking = brakingTarget(m.brake, false);
    }
  } else if (speed > limit) {
    // 桿子推不過速度旗；沒有自動輕煞的規則組，旗子降下來時也安靜地收回。
    speed = m.speed <= limit + AUTO_BRAKE_MARGIN ? limit : Math.max(limit, speed - BLEED * dt);
  }
  if (
    m.level === "look" &&
    m.progress >= m.station.approachAt &&
    m.progress < m.station.target - m.station.greenHalf / 2 &&
    m.brake < EMERGENCY &&
    speed < LOOK_CREEP
  ) {
    speed = LOOK_CREEP;
  }
  if (speed < 0) speed = 0;
  speed = quant(speed);

  const progress = quant(m.progress + ((m.speed + speed) / 2) * PROGRESS_RATE * dt);
  return { tractive, braking, speed, progress, deceleration: Math.max(0, -accel), autoBrake, autoBrakeStarted };
}

/** 作用換成桿上的位置（0 到最後一格，可以有小數），給桿槽填色用。 */
export function effortNotch(table: readonly number[], effort: number): number {
  if (!(effort > 0)) return 0;
  for (let i = 1; i < table.length; i += 1) {
    const hi = table[i]!;
    if (effort <= hi) {
      const lo = table[i - 1]!;
      return i - 1 + (effort - lo) / (hi - lo);
    }
  }
  return table.length - 1;
}
