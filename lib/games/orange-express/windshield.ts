import type { Phase } from "@/lib/games/orange-express/types";

/** 一站的 0–1 在前窗裡等於幾公尺的世界。只影響畫面，不影響判定。 */
export const STATION_WORLD = 600;
const Z_NEAR = 2;
const Z_FAR = 220;
const EYE = 1.6;
const SLEEPER_GAP = 0.9;
const PORTAL_GAP = 50;
const PLATFORM_BEFORE = 70;
const PLATFORM_AFTER = 28;
const POST_AHEAD = 9;

/** 減少動態時只停在這三格，不連續往前跑。 */
export function windshieldFrame(progress: number, phase: Phase): 0 | 1 | 2 {
  if (phase === "stopped" || phase === "doors-open" || phase === "route-done") return 2;
  if (phase === "in-window" || phase === "reversing" || progress >= 0.45) return 1;
  return 0;
}

/** 前窗用的世界位置（公尺）。減少動態時只回三個固定值。 */
export function cameraTravel(reduced: boolean, progress: number, phase: Phase, target: number): number {
  if (!reduced) return progress * STATION_WORLD;
  const frame = windshieldFrame(progress, phase);
  if (frame === 2) return target * STATION_WORLD;
  if (frame === 1) return (target - 0.12) * STATION_WORLD;
  return 0.1 * STATION_WORLD;
}

const SKY_TOP = "rgb(150, 204, 238)";
const SKY_LOW = "rgb(222, 240, 252)";
const CLOUD = "rgb(255, 252, 246)";
const HILL_FAR = "rgb(176, 214, 170)";
const HILL_NEAR = "rgb(150, 198, 140)";
const GROUND = "rgb(196, 222, 160)";
const BALLAST = "rgb(214, 204, 186)";
const RAIL = "rgb(120, 116, 112)";
const RAIL_SHINE = "rgb(236, 232, 224)";
const SLEEPER = "rgb(176, 150, 120)";
const POLE = "rgb(132, 140, 150)";
const WIRE = "rgb(110, 116, 124)";
const PLATFORM_TOP = "rgb(250, 230, 200)";
const PLATFORM_FACE = "rgb(214, 176, 134)";
const PLATFORM_LINE = "rgb(255, 210, 90)";
const POST = "rgb(255, 140, 43)";
const POST_FACE = "rgb(255, 248, 236)";

export type WindshieldPaint = {
  progress: number;
  phase: Phase;
  reduced: boolean;
  /** 這一站停車目標（0–1），月台與停車柱以它為準。 */
  target: number;
};

type View = { w: number; h: number; vx: number; hy: number; f: number };

function project(view: View, x: number, y: number, z: number): { x: number; y: number } {
  const s = view.f / z;
  return { x: view.vx + x * s, y: view.hy + (EYE - y) * s };
}

function quad(
  ctx: CanvasRenderingContext2D,
  view: View,
  x0: number,
  x1: number,
  y: number,
  z0: number,
  z1: number,
  color: string,
): void {
  const a = project(view, x0, y, z0);
  const b = project(view, x1, y, z0);
  const c = project(view, x1, y, z1);
  const d = project(view, x0, y, z1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
}

function line(
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  y: number,
  z0: number,
  z1: number,
  color: string,
  width: number,
): void {
  const a = project(view, x, y, z0);
  const b = project(view, x, y, z1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawBackdrop(ctx: CanvasRenderingContext2D, view: View): void {
  const { w, h, hy } = view;
  const sky = ctx.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, SKY_TOP);
  sky.addColorStop(1, SKY_LOW);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, hy + 1);

  ctx.fillStyle = CLOUD;
  for (const [cx, cy, r] of [
    [0.2, 0.14, 0.05],
    [0.74, 0.1, 0.04],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(w * cx, h * cy, w * r * 1.8, h * r, 0, 0, Math.PI * 2);
    ctx.ellipse(w * (cx + r), h * (cy - r * 0.6), w * r * 1.1, h * r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = HILL_FAR;
  ctx.beginPath();
  ctx.moveTo(0, hy);
  ctx.quadraticCurveTo(w * 0.18, hy - h * 0.1, w * 0.38, hy - h * 0.02);
  ctx.quadraticCurveTo(w * 0.6, hy - h * 0.12, w * 0.82, hy - h * 0.03);
  ctx.quadraticCurveTo(w * 0.92, hy - h * 0.07, w, hy - h * 0.04);
  ctx.lineTo(w, hy + 1);
  ctx.lineTo(0, hy + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = HILL_NEAR;
  ctx.beginPath();
  ctx.moveTo(w * 0.55, hy + 1);
  ctx.quadraticCurveTo(w * 0.78, hy - h * 0.06, w, hy - h * 0.01);
  ctx.lineTo(w, hy + 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = GROUND;
  ctx.fillRect(0, hy, w, h - hy);
}

function drawTrack(ctx: CanvasRenderingContext2D, view: View, center: number, travel: number): void {
  quad(ctx, view, center - 1.7, center + 1.7, 0, Z_NEAR, Z_FAR, BALLAST);
  const offset = ((travel % SLEEPER_GAP) + SLEEPER_GAP) % SLEEPER_GAP;
  for (let z = Z_NEAR + SLEEPER_GAP - offset; z < 70; z += SLEEPER_GAP) {
    quad(ctx, view, center - 1.25, center + 1.25, 0, z, z + 0.24, SLEEPER);
  }
  const railWidth = Math.max(2, view.w / 160);
  for (const side of [-0.75, 0.75]) {
    line(ctx, view, center + side, 0.05, Z_NEAR, Z_FAR, RAIL, railWidth * 1.6);
    line(ctx, view, center + side, 0.08, Z_NEAR, Z_FAR, RAIL_SHINE, Math.max(1, railWidth * 0.5));
  }
}

function drawPortals(ctx: CanvasRenderingContext2D, view: View, travel: number): void {
  const offset = ((travel % PORTAL_GAP) + PORTAL_GAP) % PORTAL_GAP;
  for (let z = PORTAL_GAP - offset; z < Z_FAR; z += PORTAL_GAP) {
    if (z < Z_NEAR + 0.5) continue;
    const width = Math.max(1.5, (view.f / z) * 0.22);
    for (const x of [-2.9, 2.3, 7]) {
      const foot = project(view, x, 0, z);
      const top = project(view, x, 6.4, z);
      ctx.fillStyle = POLE;
      ctx.fillRect(foot.x - width / 2, top.y, width, foot.y - top.y);
    }
    const left = project(view, -2.9, 6.2, z);
    const right = project(view, 7, 6.2, z);
    ctx.fillRect(left.x, left.y - width / 2, right.x - left.x, width);
  }
  const wireWidth = Math.max(1, view.w / 420);
  line(ctx, view, 0, 5.4, Z_NEAR, Z_FAR, WIRE, wireWidth);
  line(ctx, view, 4.6, 5.4, Z_NEAR, Z_FAR, WIRE, wireWidth);
}

function drawPlatform(ctx: CanvasRenderingContext2D, view: View, travel: number, targetWorld: number): void {
  const z0 = Math.max(Z_NEAR, targetWorld - PLATFORM_BEFORE - travel);
  const z1 = Math.min(Z_FAR, targetWorld + PLATFORM_AFTER - travel);
  if (z1 <= z0) return;
  const edge = -1.9;
  const top = 1.1;
  const a = project(view, edge, 0, z0);
  const b = project(view, edge, top, z0);
  const c = project(view, edge, top, z1);
  const d = project(view, edge, 0, z1);
  ctx.fillStyle = PLATFORM_FACE;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
  quad(ctx, view, -40, edge, top, z0, z1, PLATFORM_TOP);
  quad(ctx, view, -2.75, -2.45, top, z0, z1, PLATFORM_LINE);

  const postZ = targetWorld + POST_AHEAD - travel;
  if (postZ > Z_NEAR + 0.3 && postZ < Z_FAR) {
    const foot = project(view, -2.3, top, postZ);
    const head = project(view, -2.3, top + 2.1, postZ);
    const scale = view.f / postZ;
    const width = Math.max(2, scale * 0.12);
    ctx.fillStyle = POST;
    ctx.fillRect(foot.x - width / 2, head.y, width, foot.y - head.y);
    const radius = Math.max(3, scale * 0.38);
    ctx.beginPath();
    ctx.arc(head.x, head.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = POST_FACE;
    ctx.beginPath();
    ctx.arc(head.x, head.y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 天空、遠山、兩條軌道、電車線門架、左邊一座月台與一根停車柱。
 * 只有幾何色塊，不貼圖、不模糊、不畫字、不畫真實車頭。
 */
export function drawWindshield(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  paint: WindshieldPaint,
): void {
  const view: View = {
    w: width,
    h: height,
    vx: width * 0.5,
    hy: height * 0.42,
    f: (height * 0.58 * Z_NEAR) / EYE,
  };
  const travel = cameraTravel(paint.reduced, paint.progress, paint.phase, paint.target);
  ctx.clearRect(0, 0, width, height);
  drawBackdrop(ctx, view);
  drawTrack(ctx, view, 4.6, travel);
  drawTrack(ctx, view, 0, travel);
  drawPlatform(ctx, view, travel, paint.target * STATION_WORLD);
  drawPortals(ctx, view, travel);
}
