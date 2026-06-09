/** Arcade 卡丁車物理常數（單一真相來源，P1 起調手感）。 */
export const PHYSICS = {
  step: 1 / 60,
  maxFrameDt: 0.05,

  engineAccel: 42,
  brakeForce: 55,
  drag: 2.8,
  roll: 1.2,
  reverseMax: 12,
  maxSteer: 2.6,

  grip: 9,
  driftGrip: 3.2,
  driftMinSpeed: 14,

  boostSpeedMul: 1.22,
  boostAccelMul: 1.35,
  boostDuration: 0.85,
  driftChargeToBoost: 0.52,

  offTrackDragMul: 4,
  offTrackSpeedCap: 18,
  wallPushStrength: 0.35,
  wallSpeedLoss: 0.55,
} as const;

export const CAMERA = {
  followDistance: 9,
  followHeight: 4.2,
  lookAhead: 5,
  positionLag: 6,
  fovBase: 62,
  fovSpeed: 18,
  fovBoost: 8,
  driftRoll: 0.12,
} as const;
