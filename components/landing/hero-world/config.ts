export type Quality = "high" | "medium" | "low";
// Complete Phase 8 release; v1 and v2 remain available for rollback.
export const MODEL_PATH = "/models/hero-world/v3";
export const QUALITY = {
  high: { dpr: 1.5, trees: 8, shadows: true },
  medium: { dpr: 1.25, trees: 6, shadows: false },
  low: { dpr: 1, trees: 4, shadows: false },
} as const;

export function chooseQuality(cores: number, memory: number, mobile: boolean): Quality {
  if (cores <= 2 || memory <= 2) return "low";
  if (mobile || cores <= 4 || memory <= 4) return "medium";
  return "high";
}
export function lowerQuality(quality: Quality): Quality {
  return quality === "high" ? "medium" : "low";
}
export const TREE_PLACEMENTS = [
  [-4.35, -.4, .95], [-3.9, -2.1, 1.05], [3.65, -2.2, .92], [4.7, -.6, .85],
  [-2.8, -2.95, .82], [-.7, -3.28, .75], [4.7, .8, .65], [-4.6, 1.8, .64],
] as const;
export const ARRIVAL_SECONDS = 18;
export const DRIVE_CLIP_SECONDS = 2;
export const WHEEL_RADIUS = .275;
export const ROAD_START_ANGLE = -.95;
const PATH_A = 3.98;
const PATH_B = 2.48;

// Arc-length lookup for the elliptical road. The table keeps the runtime
// cheap while ensuring the wheel clip follows distance rather than angle.
const ARC_SAMPLES = 128;
const ARC_LENGTHS = (() => {
  const values = [0];
  let total = 0;
  for (let i = 1; i <= ARC_SAMPLES; i++) {
    const a0 = ROAD_START_ANGLE + (i - 1) * Math.PI * 2 / ARC_SAMPLES;
    const a1 = ROAD_START_ANGLE + i * Math.PI * 2 / ARC_SAMPLES;
    const speed = (a: number) => Math.hypot(PATH_A * Math.cos(a), PATH_B * Math.sin(a));
    total += ((speed(a0) + 4 * speed((a0 + a1) / 2) + speed(a1)) * (a1 - a0)) / 6;
    values.push(total);
  }
  return values;
})();

export const ROAD_LENGTH = ARC_LENGTHS[ARC_SAMPLES];

export function distanceAtProgress(progress: number): number {
  const p = Math.min(Math.max(progress, 0), 1) * ARC_SAMPLES;
  const index = Math.min(Math.floor(p), ARC_SAMPLES - 1);
  const fraction = p - index;
  return ARC_LENGTHS[index] + (ARC_LENGTHS[index + 1] - ARC_LENGTHS[index]) * fraction;
}

export function wheelAnimationTime(progress: number, clipDuration = DRIVE_CLIP_SECONDS): number {
  return distanceAtProgress(progress) / (Math.PI * 2 * WHEEL_RADIUS) * clipDuration;
}

export type MotionPhase = "approach" | "decelerate" | "stop" | "settle" | "acknowledge" | "continue" | "settled";

export function motionPhase(seconds: number): MotionPhase {
  if (seconds < 3.5) return "approach";
  if (seconds < 4.5) return "decelerate";
  if (seconds < 4.58) return "stop";
  if (seconds < 4.9) return "settle";
  if (seconds < 6.2) return "acknowledge";
  if (seconds < ARRIVAL_SECONDS) return "continue";
  return "settled";
}

/** 4.5s arrive, 1.7s acknowledge, then smoothly leave; speed is zero at the stop. */
export function driveProgress(seconds: number): number {
  const t = Math.min(Math.max(seconds, 0), ARRIVAL_SECONDS);
  if (t < 4.5) return .07 * (1 - Math.pow(1 - t / 4.5, 2));
  if (t < 6.2) return .07;
  const u = (t - 6.2) / (ARRIVAL_SECONDS - 6.2);
  return .07 + .93 * u * u * (3 - 2 * u);
}

export function greetingPose(seconds: number) {
  const settle = Math.max(0, seconds - 4.5);
  const greeting = seconds >= 4.9 && seconds < 6.2;
  const look = greeting ? Math.sin((seconds - 4.9) / 1.3 * Math.PI) : 0;
  return {
    greeting,
    settle: seconds < 4.5 ? 0 : -.016 * Math.sin(settle * 10) * Math.exp(-settle * 5),
    look: look * .12,
  };
}
