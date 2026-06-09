import * as THREE from "three";
import { PHYSICS } from "../data/config";
import type { KartStats } from "../data/karts";
import type { KartInput } from "../core/Input";

export type KartState = {
  pos: THREE.Vector3;
  prevPos: THREE.Vector3;
  yaw: number;
  prevYaw: number;
  speed: number;
  vel: THREE.Vector3;
  drift: { active: boolean; dir: number; charge: number };
  boost: number;
  offTrack: boolean;
};

export function createKartState(x = 0, z = 0, yaw = 0): KartState {
  const pos = new THREE.Vector3(x, 0.35, z);
  return {
    pos,
    prevPos: pos.clone(),
    yaw,
    prevYaw: yaw,
    speed: 0,
    vel: new THREE.Vector3(),
    drift: { active: false, dir: 0, charge: 0 },
    boost: 0,
    offTrack: false,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function boostFromCharge(charge: number): number {
  return clamp(charge * PHYSICS.driftChargeToBoost, 0, PHYSICS.boostDuration);
}

/** Kinematic arcade 載具模擬（P0 基礎 + P1 漂移骨架）。 */
export function simulateKart(
  state: KartState,
  input: KartInput,
  stats: KartStats,
  dt: number,
  offTrack: boolean,
): void {
  state.prevPos.copy(state.pos);
  state.prevYaw = state.yaw;
  state.offTrack = offTrack;

  const cfg = PHYSICS;
  const boostMul = state.boost > 0 ? cfg.boostSpeedMul : 1;
  const accelMul = state.boost > 0 ? cfg.boostAccelMul : 1;

  let drag = cfg.drag;
  let roll = cfg.roll;
  let maxSpeed = stats.maxSpeed * boostMul;

  if (offTrack) {
    drag *= cfg.offTrackDragMul;
    maxSpeed = Math.min(maxSpeed, cfg.offTrackSpeedCap);
  }

  const accel =
    input.throttle * stats.engineAccel * accelMul -
    input.brake * stats.brakeForce -
    drag * Math.abs(state.speed) -
    roll;

  state.speed += accel * dt;
  state.speed = clamp(state.speed, -cfg.reverseMax, maxSpeed);

  const speedFactor =
    smoothstep(0, stats.maxSpeed * 0.25, Math.abs(state.speed)) *
    lerp(1, 0.6, Math.abs(state.speed) / stats.maxSpeed);
  const steerAngle = input.steer * cfg.maxSteer * speedFactor;
  if (Math.abs(state.speed) > 0.05) {
    state.yaw += steerAngle * dt * Math.sign(state.speed);
  }

  const gripBase = state.drift.active ? cfg.driftGrip : stats.grip;
  const fwd = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
  const targetVel = fwd.clone().multiplyScalar(state.speed);
  const gripT = 1 - Math.exp(-gripBase * dt);
  state.vel.lerp(targetVel, gripT);
  state.pos.addScaledVector(state.vel, dt);

  // 漂移蓄力 → 迷你加速（P1 手感核心，P0 已接線）
  if (
    input.handbrake &&
    Math.abs(input.steer) > 0.3 &&
    Math.abs(state.speed) > cfg.driftMinSpeed
  ) {
    state.drift.active = true;
    state.drift.dir = Math.sign(input.steer) || state.drift.dir;
    state.drift.charge += dt;
  } else if (state.drift.active) {
    state.boost = Math.max(state.boost, boostFromCharge(state.drift.charge));
    state.drift = { active: false, dir: 0, charge: 0 };
  }

  if (state.boost > 0) state.boost -= dt;
}

export function kartRenderPose(state: KartState, alpha: number): { pos: THREE.Vector3; yaw: number } {
  const pos = state.prevPos.clone().lerp(state.pos, alpha);
  const yaw = lerp(state.prevYaw, state.yaw, alpha);
  return { pos, yaw };
}
