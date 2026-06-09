import type { KartInput } from "../core/Input";
import type { KartState } from "./Kart";
import type { Track } from "./Track";

export type AIProfile = {
  skill: number;
  aggression: number;
  name: string;
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** 沿 spline 前視點 + 橡皮筋難度（P3）。 */
export function driveAI(
  state: KartState,
  track: Track,
  profile: AIProfile,
  positionFactor: number,
  dt: number,
): KartInput {
  const { progress } = track.getProgress(state.pos.x, state.pos.z);
  const lookM = 8 + profile.skill * 14;
  const target = track.getLookahead(progress, lookM);

  const dx = target.x - state.pos.x;
  const dz = target.z - state.pos.z;
  const desiredYaw = Math.atan2(dx, dz);
  let steerErr = desiredYaw - state.yaw;
  while (steerErr > Math.PI) steerErr -= Math.PI * 2;
  while (steerErr < -Math.PI) steerErr += Math.PI * 2;

  const steer = clamp(steerErr * (1.8 + profile.skill), -1, 1);
  const turnPenalty = clamp(1 - Math.abs(steerErr) / 1.2, 0.35, 1);
  const rubber = clamp(1 + positionFactor * 0.12, 0.88, 1.12);

  const throttle = clamp((0.55 + profile.aggression * 0.35) * turnPenalty * rubber, 0, 1);
  const handbrake =
    Math.abs(steerErr) > 0.55 &&
    Math.abs(state.speed) > 16 &&
    profile.skill > 0.45 &&
    Math.random() < profile.skill * dt * 2;

  return {
    throttle,
    brake: state.speed > 52 ? 0.4 : 0,
    steer,
    handbrake,
    item: false,
  };
}
