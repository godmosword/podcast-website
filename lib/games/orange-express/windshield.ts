import type { Phase } from "@/lib/games/orange-express/types";

/** 減少動態時只停在這三格，不連續往前跑。 */
export function windshieldFrame(progress: number, phase: Phase): 0 | 1 | 2 {
  if (phase === "stopped" || phase === "doors-open" || phase === "route-done") return 2;
  if (phase === "in-window" || progress >= 0.45) return 1;
  return 0;
}

export function cameraOffset(reduced: boolean, progress: number, phase: Phase): number {
  const frame = windshieldFrame(progress, phase);
  if (reduced) return frame * 3;
  return progress * 8;
}

const SKY = "rgb(186, 220, 245)";
const GROUND = "rgb(186, 214, 150)";
const RAIL = "rgb(90, 98, 110)";
const SLEEPER = "rgb(196, 148, 90)";
const POLE = "rgb(70, 78, 92)";
const WIRE = "rgb(120, 128, 138)";
const PLATFORM = "rgb(255, 214, 170)";
const POST = "rgb(255, 138, 70)";
const HORIZON = "rgb(232, 244, 255)";

export type WindshieldPaint = {
  progress: number;
  phase: Phase;
  reduced: boolean;
};

/**
 * 只畫天空、地面、兩條鐵軌、枕木、電車線杆、一座月台與一根停車柱。
 * 不貼圖、不模糊、不畫真實車頭。
 */
export function drawWindshield(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  paint: WindshieldPaint,
): void {
  const travel = cameraOffset(paint.reduced, paint.progress, paint.phase);
  const frame = windshieldFrame(paint.progress, paint.phase);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = SKY;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = HORIZON;
  ctx.fillRect(0, height * 0.34, width, height * 0.08);
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, height * 0.42, width, height * 0.58);

  const vanishX = width * 0.5;
  const vanishY = height * 0.4;
  const nearY = height * 0.92;

  for (let i = 0; i < 8; i += 1) {
    const z = ((i * 0.12 + travel * 0.04) % 1);
    const depth = paint.reduced ? (frame === 0 ? 0.75 : frame === 1 ? 0.4 : 0.18) : z;
    const y = vanishY + (nearY - vanishY) * (1 - depth);
    const spread = 18 + (1 - depth) * width * 0.42;
    ctx.strokeStyle = WIRE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vanishX - spread * 0.15, vanishY);
    ctx.lineTo(vanishX - spread, y);
    ctx.stroke();
    ctx.fillStyle = POLE;
    ctx.fillRect(vanishX - spread - 3, y - 28 * (1 - depth + 0.2), 6, 36 * (1 - depth + 0.2));
  }

  ctx.strokeStyle = RAIL;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(vanishX - 6, vanishY);
  ctx.lineTo(width * 0.28, nearY);
  ctx.moveTo(vanishX + 6, vanishY);
  ctx.lineTo(width * 0.72, nearY);
  ctx.stroke();

  for (let i = 0; i < 12; i += 1) {
    const slot = paint.reduced ? (i + frame * 2) % 12 : (i + Math.floor(travel * 3)) % 12;
    const t = slot / 12;
    const y = vanishY + (nearY - vanishY) * t * t;
    const half = 8 + t * t * width * 0.22;
    ctx.fillStyle = SLEEPER;
    ctx.fillRect(vanishX - half, y, half * 2, Math.max(3, 4 + t * 6));
  }

  if (frame >= 1) {
    const platformNear = frame === 2 ? width * 0.78 : width * 0.7;
    ctx.fillStyle = PLATFORM;
    ctx.beginPath();
    ctx.moveTo(vanishX + 20, vanishY + 8);
    ctx.lineTo(platformNear, height * 0.62);
    ctx.lineTo(width, height * 0.62);
    ctx.lineTo(width, height * 0.78);
    ctx.lineTo(width * 0.62, height * 0.84);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = POST;
    const postX = frame === 2 ? width * 0.8 : width * 0.86;
    ctx.fillRect(postX, height * 0.48, 8, height * 0.2);
    ctx.beginPath();
    ctx.arc(postX + 4, height * 0.46, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}
