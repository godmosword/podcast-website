import {
  lightPhase,
  poseFor,
  projectNorm,
  sortDrawOrder,
  spriteScale,
  type BoardSimState,
  type BoardView,
  type SimActor,
  type TownProp,
} from "@/lib/episode-board-sim";
import type { BoardCharacterId } from "@/lib/episode-board-types";

export type BoardPalette = {
  sky: string;
  sky2: string;
  grass: string;
  grassDeep: string;
  path: string;
  card: string;
  ink: string;
  racer: string;
  dino: string;
  dinoBelly: string;
  truck: string;
  paintA: string;
  paintB: string;
  paintC: string;
  wheel: string;
  roof: string;
  water: string;
  sun: string;
  leaf: string;
  trunk: string;
  yellow: string;
  pink: string;
  mint: string;
  cream: string;
  paper: string;
  window: string;
};

const PALETTE_VARS: Record<keyof BoardPalette, string> = {
  sky: "--board-sky",
  sky2: "--board-sky-2",
  grass: "--board-grass",
  grassDeep: "--board-grass-deep",
  path: "--board-path",
  card: "--board-card",
  ink: "--board-ink",
  racer: "--board-racer",
  dino: "--board-dino",
  dinoBelly: "--board-dino-belly",
  truck: "--board-truck",
  paintA: "--board-paint-a",
  paintB: "--board-paint-b",
  paintC: "--board-paint-c",
  wheel: "--board-wheel",
  roof: "--board-roof",
  water: "--board-water",
  sun: "--board-sun",
  leaf: "--board-leaf",
  trunk: "--board-trunk",
  yellow: "--board-yellow",
  pink: "--board-pink",
  mint: "--board-mint",
  cream: "--board-cream",
  paper: "--board-paper",
  window: "--board-window",
};

export function readBoardPalette(style: CSSStyleDeclaration): BoardPalette {
  const palette = {} as BoardPalette;
  for (const key of Object.keys(PALETTE_VARS) as (keyof BoardPalette)[]) {
    const value = style.getPropertyValue(PALETTE_VARS[key]).trim();
    palette[key] = value || "transparent";
  }
  return palette;
}

export function drawTown(
  ctx: CanvasRenderingContext2D,
  view: BoardView,
  state: BoardSimState,
  palette: BoardPalette,
  fontFamily: string,
) {
  const { width, height } = view;
  ctx.clearRect(0, 0, width, height);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, palette.sky2);
  sky.addColorStop(1, palette.sky);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const cloud = Math.min(width * 0.055, 46);
  drawCloud(ctx, width * 0.2, height * 0.14, cloud, palette.card);
  drawCloud(ctx, width * 0.74, height * 0.11, cloud * 0.8, palette.card);
  drawSun(ctx, width * 0.86, height * 0.16, Math.min(28, width * 0.035), palette.sun);
  drawIsland(ctx, view, palette);

  drawPath(ctx, view, palette.path);

  for (const entity of sortDrawOrder(state)) {
    if (entity.kind === "prop" && entity.prop) {
      drawProp(ctx, entity.prop, view, palette, state.age);
    } else if (entity.actor) {
      drawActor(ctx, entity.actor, view, palette, fontFamily);
    }
  }
}

function drawIsland(
  ctx: CanvasRenderingContext2D,
  view: BoardView,
  palette: BoardPalette,
) {
  const cx = view.width * 0.5;
  const cy = view.height * 0.6;
  const hw = view.width * 0.42;
  const hh = view.height * 0.26;
  ctx.fillStyle = palette.grassDeep;
  roundedDiamond(ctx, cx, cy + Math.min(18, view.height * 0.03), hw, hh);
  ctx.fill();
  ctx.fillStyle = palette.grass;
  roundedDiamond(ctx, cx, cy, hw, hh);
  ctx.fill();
}

function roundedDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.quadraticCurveTo(cx + hw * 0.55, cy - hh * 0.55, cx + hw, cy);
  ctx.quadraticCurveTo(cx + hw * 0.55, cy + hh * 0.55, cx, cy + hh);
  ctx.quadraticCurveTo(cx - hw * 0.55, cy + hh * 0.55, cx - hw, cy);
  ctx.quadraticCurveTo(cx - hw * 0.55, cy - hh * 0.55, cx, cy - hh);
  ctx.closePath();
}

function drawPath(ctx: CanvasRenderingContext2D, view: BoardView, color: string) {
  const stones = [
    [28, 34],
    [36, 34],
    [44, 33],
    [52, 36],
    [58, 34],
    [50, 44],
    [40, 43],
    [34, 42],
  ] as const;
  ctx.fillStyle = color;
  for (const [x, y] of stones) {
    const p = project(x, y, view);
    ellipse(ctx, p.x, p.y, 16, 9);
    ctx.fill();
  }
}

function drawProp(
  ctx: CanvasRenderingContext2D,
  prop: TownProp,
  view: BoardView,
  palette: BoardPalette,
  age: number,
) {
  const p = project(prop.x, prop.y, view);
  const s = scaleOf(view);
  if (prop.kind === "pond") {
    shadow(ctx, p.x, p.y, s * 16, s * 7, palette.wheel);
    ctx.fillStyle = palette.water;
    ellipse(ctx, p.x, p.y, s * 16, s * 8);
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = palette.card;
    ellipse(ctx, p.x - s * 4, p.y - s * 2, s * 5, s * 2.2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  if (prop.kind === "tree") {
    shadow(ctx, p.x, p.y, s * 9, s * 3.2, palette.wheel);
    ctx.fillStyle = palette.trunk;
    ellipse(ctx, p.x, p.y - s * 4, s * 2.4, s * 7);
    ctx.fill();
    ctx.fillStyle = palette.leaf;
    circle(ctx, p.x - s * 4, p.y - s * 10, s * 6);
    circle(ctx, p.x + s * 4.2, p.y - s * 9, s * 5.6);
    circle(ctx, p.x, p.y - s * 14, s * 7);
    ctx.fillStyle = palette.grassDeep;
    circle(ctx, p.x - s * 1.5, p.y - s * 12, s * 2.2);
    return;
  }
  if (prop.kind === "candy") {
    shadow(ctx, p.x, p.y, s * 6, s * 2.4, palette.wheel);
    ctx.strokeStyle = palette.wheel;
    ctx.lineWidth = Math.max(2, s * 0.7);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y - s * 10);
    ctx.stroke();
    ctx.fillStyle = palette.pink;
    circle(ctx, p.x, p.y - s * 12, s * 4.2);
    ctx.fillStyle = palette.card;
    circle(ctx, p.x, p.y - s * 12, s * 1.6);
    return;
  }
  if (prop.kind === "light") {
    drawLight(ctx, p.x, p.y, s, palette, lightPhase(age));
    return;
  }
  shadow(ctx, p.x, p.y, s * 16, s * 5, palette.wheel);
  ctx.fillStyle = palette.cream;
  ellipse(ctx, p.x, p.y - s * 5, s * 16, s * 7);
  ctx.fill();
  ctx.fillStyle = palette.roof;
  ctx.beginPath();
  ctx.moveTo(p.x - s * 18, p.y - s * 7);
  ctx.quadraticCurveTo(p.x, p.y - s * 20, p.x + s * 18, p.y - s * 7);
  ctx.quadraticCurveTo(p.x + s * 2, p.y - s * 4, p.x - s * 18, p.y - s * 7);
  ctx.fill();
  ctx.fillStyle = palette.yellow;
  ellipse(ctx, p.x + s * 9, p.y - s * 12, s * 1.6, s * 3.2);
  ctx.fill();
  ctx.fillStyle = palette.window;
  circle(ctx, p.x - s * 6, p.y - s * 6, s * 2.2);
  ctx.fillStyle = palette.wheel;
  ellipse(ctx, p.x + s * 4, p.y - s * 2.4, s * 2.4, s * 3.4);
  ctx.fill();
}

function drawLight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  palette: BoardPalette,
  phase: "stop" | "count" | "go",
) {
  shadow(ctx, x, y, s * 5, s * 2, palette.wheel);
  ctx.fillStyle = palette.wheel;
  ellipse(ctx, x, y - s * 7, s * 1.6, s * 7);
  ctx.fill();
  ctx.fillStyle = palette.wheel;
  roundLampHousing(ctx, x, y - s * 16, s * 4.2, s * 9);
  const lamps = [
    { id: "stop", color: palette.pink, y: y - s * 20.5 },
    { id: "count", color: palette.yellow, y: y - s * 16 },
    { id: "go", color: palette.mint, y: y - s * 11.5 },
  ] as const;
  for (const lamp of lamps) {
    const on = lamp.id === phase;
    ctx.globalAlpha = on ? 1 : 0.35;
    ctx.fillStyle = lamp.color;
    circle(ctx, x, lamp.y, on ? s * 1.7 : s * 1.15);
    ctx.globalAlpha = 1;
    if (on) {
    ctx.strokeStyle = palette.paper;
    ctx.lineWidth = Math.max(1.5, s * 0.35);
      ctx.beginPath();
      ctx.arc(x, lamp.y, s * 2.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawActor(
  ctx: CanvasRenderingContext2D,
  actor: SimActor,
  view: BoardView,
  palette: BoardPalette,
  fontFamily: string,
) {
  const p = project(actor.x, actor.y, view);
  const s = scaleOf(view);
  const pose = poseFor(actor.action, actor.age, actor.waiting);
  const bob = pose.bob * s * 0.6;
  const robot =
    actor.character === "watt" ? 1 : actor.action === "transform-robot" ? pose.robot : 0;
  if (robot > 0.08) {
    drawRobot(ctx, p.x, p.y + bob, s, palette, robot, actor.character);
  }
  if (robot < 0.92) {
    ctx.globalAlpha = 1 - robot;
    drawVehicle(ctx, p.x, p.y + bob, s, palette, actor, pose.paint, fontFamily);
    ctx.globalAlpha = 1;
  }
  if (actor.action === "brush-teeth" && robot < 0.5) {
    drawBrush(ctx, p.x + s * 4, p.y - s * 6 + bob, s, palette, pose.brush);
  }
  if (actor.action === "dig") {
    drawArm(ctx, p.x + s * 8, p.y - s * 6, s, palette, pose.dig);
  }
  if (actor.action === "sweep") {
    ctx.fillStyle = palette.yellow;
    circle(ctx, p.x - s * 8, p.y + s * 2, s * 2.4);
    circle(ctx, p.x - s * 4, p.y + s * 3, s * 2.2);
  }
}

function drawVehicle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  palette: BoardPalette,
  actor: SimActor,
  paint: 0 | 1 | 2 | 3,
  fontFamily: string,
) {
  const body = bodyColor(actor.character, palette, paint);
  const belly = actor.character === "duo-duo" ? palette.dinoBelly : palette.card;
  shadow(ctx, x, y, s * 12, s * 3.6, palette.wheel);
  ctx.fillStyle = palette.wheel;
  circle(ctx, x - s * 6, y + s * 1.2, s * 2.6);
  circle(ctx, x + s * 6, y + s * 1.2, s * 2.6);
  ctx.fillStyle = palette.cream;
  circle(ctx, x - s * 6, y + s * 1.2, s * 1.1);
  circle(ctx, x + s * 6, y + s * 1.2, s * 1.1);
  ctx.fillStyle = body;
  ellipse(ctx, x, y - s * 4, s * 12, s * 6.4);
  ctx.fill();
  ctx.fillStyle = belly;
  ellipse(ctx, x, y - s * 2.2, s * 7.5, s * 2.8);
  ctx.fill();
  ctx.fillStyle = palette.window;
  ellipse(ctx, x + s * 1.2, y - s * 7.2, s * 6, s * 3.6);
  ctx.fill();
  drawFace(ctx, x + s * 1.2, y - s * 7.1, s * 0.9, palette);
  if (actor.character === "duo-duo") {
    ctx.fillStyle = palette.yellow;
    circle(ctx, x - s * 6, y - s * 8, s * 1.5);
    circle(ctx, x - s * 3, y - s * 10, s * 1.6);
    circle(ctx, x, y - s * 10.5, s * 1.5);
  }
  if (actor.character === "xiao-hong") {
    ctx.fillStyle = palette.paper;
    circle(ctx, x - s * 3, y - s * 2.4, s * 2.6);
    ctx.fillStyle = palette.wheel;
    ctx.font = `700 ${Math.round(s * 3.1)}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("2", x - s * 3, y - s * 2.2);
    ctx.fillStyle = palette.card;
    ellipse(ctx, x + s * 8, y - s * 5, s * 1.4, s * 2.4);
    ctx.fill();
  }
  if (actor.character === "an-an") {
    ctx.fillStyle = palette.pink;
    circle(ctx, x - s * 2, y - s * 2, s * 1.8);
  }
  if (actor.character === "ling-ling") {
    ctx.fillStyle = palette.yellow;
    circle(ctx, x - s * 7, y + s * 2, s * 2);
  }
}

function drawRobot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  palette: BoardPalette,
  amount: number,
  character: BoardCharacterId,
) {
  const lift = (1 - amount) * s * 4;
  const body = character === "xiao-hong" ? palette.racer : palette.mint;
  ctx.globalAlpha = amount;
  shadow(ctx, x, y, s * 8, s * 2.6, palette.wheel);
  ctx.fillStyle = palette.wheel;
  circle(ctx, x - s * 3.2, y - lift, s * 2);
  circle(ctx, x + s * 3.2, y - lift, s * 2);
  ctx.fillStyle = body;
  circle(ctx, x, y - s * 6 - lift, s * 5.5);
  ctx.fillStyle = palette.cream;
  circle(ctx, x, y - s * 11 - lift, s * 4.2);
  drawFace(ctx, x, y - s * 11 - lift, s * 0.8, palette);
  ctx.fillStyle = body;
  circle(ctx, x - s * 6, y - s * 6 - lift, s * 1.8);
  circle(ctx, x + s * 6, y - s * 6 - lift, s * 1.8);
  ctx.fillStyle = palette.yellow;
  circle(ctx, x, y - s * 15.5 - lift, s * 1.3);
  ctx.globalAlpha = 1;
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  palette: BoardPalette,
) {
  ctx.fillStyle = palette.paper;
  circle(ctx, x - s * 2.2, y, s * 1.5);
  circle(ctx, x + s * 2.2, y, s * 1.5);
  ctx.fillStyle = palette.wheel;
  circle(ctx, x - s * 2.1, y + s * 0.2, s * 0.7);
  circle(ctx, x + s * 2.3, y + s * 0.2, s * 0.7);
  ctx.strokeStyle = palette.wheel;
  ctx.lineWidth = Math.max(1.25, s * 0.45);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y + s * 1.6, s * 1.8, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawBrush(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  palette: BoardPalette,
  phase: number,
) {
  const angle = -0.9 + phase * 0.8;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = palette.cream;
  ctx.lineWidth = Math.max(3, s * 1.3);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 8, -s * 1);
  ctx.stroke();
  ctx.fillStyle = palette.mint;
  ellipse(ctx, s * 9.2, -s * 1, s * 2.4, s * 3.2);
  ctx.fill();
  ctx.strokeStyle = palette.card;
  ctx.lineWidth = Math.max(1, s * 0.35);
  ctx.beginPath();
  ctx.moveTo(s * 8.2, -s * 2.6);
  ctx.lineTo(s * 10.2, -s * 2.6);
  ctx.moveTo(s * 8.2, -s * 1);
  ctx.lineTo(s * 10.4, -s * 1);
  ctx.moveTo(s * 8.2, s * 0.6);
  ctx.lineTo(s * 10.2, s * 0.6);
  ctx.stroke();
  ctx.restore();
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  palette: BoardPalette,
  phase: number,
) {
  const dip = Math.sin(phase * Math.PI) * s * 4;
  ctx.strokeStyle = palette.yellow;
  ctx.lineWidth = Math.max(3, s);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 6, y - s * 8, x + s * 8, y + dip);
  ctx.stroke();
  ctx.fillStyle = palette.wheel;
  circle(ctx, x + s * 8, y + dip, s * 2);
}

function bodyColor(
  character: BoardCharacterId,
  palette: BoardPalette,
  paint: 0 | 1 | 2 | 3,
): string {
  if (character === "hui-hui") {
    if (paint === 0) return palette.paintA;
    if (paint === 1) return palette.paintB;
    if (paint === 2) return palette.paintC;
    return palette.truck;
  }
  if (character === "duo-duo") return palette.dino;
  if (character === "xiao-hong") return palette.racer;
  if (character === "dong-dong") return palette.yellow;
  if (character === "ling-ling") return palette.mint;
  if (character === "an-an") return palette.cream;
  return palette.cream;
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  circle(ctx, x, y, r);
  circle(ctx, x + r * 0.9, y + r * 0.15, r * 0.75);
  circle(ctx, x - r * 0.8, y + r * 0.2, r * 0.65);
  ctx.globalAlpha = 1;
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.fillStyle = color;
  circle(ctx, x, y, r);
}

function shadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.12;
  ellipse(ctx, x + 2, y + 3, rx, ry);
  ctx.fill();
  ctx.restore();
}

function roundLampHousing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function project(x: number, y: number, view: BoardView): { x: number; y: number } {
  const norm = projectNorm(x, y);
  return { x: norm.u * view.width, y: norm.v * view.height };
}

function scaleOf(view: BoardView): number {
  return spriteScale(view);
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.fill();
}
