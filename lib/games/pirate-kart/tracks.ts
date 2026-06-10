// ── 畫布與賽道常數 ──────────────────────────────────────────
export const W = 400;
export const H = 300;
export const CX = 200;
export const CY = 150;
export const RX_OUT = 168;
export const RY_OUT = 112;
export const RX_IN = 72;
export const RY_IN = 48;
export const TOTAL_LAPS = 3;
export const AI_COUNT = 3;

export const TREASURES: { x: number; y: number; taken: boolean }[] = [
  { x: 200, y: 28, taken: false },
  { x: 355, y: 150, taken: false },
  { x: 200, y: 272, taken: false },
  { x: 45, y: 150, taken: false },
  { x: 280, y: 70, taken: false },
  { x: 120, y: 230, taken: false },
];

export const WAYPOINTS = Array.from({ length: 20 }, (_, i) => {
  const a = (i / 20) * Math.PI * 2;
  const rx = (RX_OUT + RX_IN) * 0.5;
  const ry = (RY_OUT + RY_IN) * 0.5;
  return { x: CX + Math.sin(a) * rx, y: CY - Math.cos(a) * ry };
});

export const CHECK_ANGLES = [Math.PI * 0.5, Math.PI, Math.PI * 1.5, Math.PI * 2];

export function resetTreasures(): void {
  for (const t of TREASURES) t.taken = false;
}
