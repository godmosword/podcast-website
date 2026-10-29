/**
 * 圓潤方塊小鎮。地面先畫進一張快取；車跟建物每一幀只貼已經做好圓角的 sprite。
 */

import {
  agentOrigin,
  bounceHeight,
  eyesClosed,
  groundKind,
  piecesForFrame,
  projectIso,
  TOWN_PROPS,
  type IsoLayout,
  type TownAgent,
  type TownProp,
} from "@/lib/episode-board-grid";
import { blockSprite, mix, shade, shadowSprite, type ShapeId } from "@/lib/episode-board-sprites";
import type { LightPhase } from "@/lib/episode-board-sim";
import { canvasPixelSize, poseFor, type BoardPose } from "@/lib/episode-board-sim";
import type { BoardActionId, BoardCharacterId } from "@/lib/episode-board-types";

export type TownPalette = {
  sky: string;
  skyBlue: string;
  leaf: string;
  pink: string;
  yellow: string;
  mint: string;
  teal: string;
  lilac: string;
  brand: string;
  card: string;
  ink: string;
  brandInk: string;
  paper: string;
};

export const FALLBACK_PALETTE: TownPalette = {
  sky: "rgb(212, 236, 255)",
  skyBlue: "rgb(143, 205, 232)",
  leaf: "rgb(183, 223, 155)",
  pink: "rgb(247, 168, 196)",
  yellow: "rgb(255, 216, 102)",
  mint: "rgb(183, 223, 155)",
  teal: "rgb(121, 200, 193)",
  lilac: "rgb(197, 179, 230)",
  brand: "rgb(255, 140, 43)",
  card: "rgb(255, 255, 255)",
  ink: "rgb(52, 48, 43)",
  brandInk: "rgb(58, 36, 16)",
  paper: "rgb(255, 248, 242)",
};

export type PaintCar = {
  id: string;
  character: BoardCharacterId;
  action: BoardActionId;
  index: number;
  age: number;
  agent: TownAgent;
};

type Put = (x: number, y: number, z: number, color: string, shape: ShapeId, scale: number) => void;

let floorCanvas: HTMLCanvasElement | null = null;
let floorKey = "";

export function buildFloor(
  view: { width: number; height: number },
  layout: IsoLayout,
  palette: TownPalette,
  dpr: number,
): HTMLCanvasElement {
  const px = canvasPixelSize(view.width, view.height, dpr);
  const key = `${px.width}x${px.height}|${layout.tw.toFixed(2)}|${palette.sky}|${palette.leaf}|${palette.yellow}`;
  if (floorCanvas && floorKey === key) return floorCanvas;
  const canvas = document.createElement("canvas");
  canvas.width = px.width;
  canvas.height = px.height;
  floorCanvas = canvas;
  floorKey = key;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.setTransform(px.ratio, 0, 0, px.ratio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = palette.sky;
  ctx.fillRect(0, 0, view.width, view.height);

  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y <= 9; y += 1) {
    for (let x = 0; x <= 12; x += 1) tiles.push({ x, y });
  }
  tiles.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
  for (const tile of tiles) {
    const kind = groundKind(tile.x, tile.y);
    const alt = (tile.x + tile.y) % 2 === 0;
    const color =
      kind === "pond"
        ? shade(palette.skyBlue, 0.86)
        : kind === "road"
          ? alt
            ? shade(palette.yellow, 0.8)
            : shade(palette.yellow, 0.7)
          : alt
            ? palette.leaf
            : shade(palette.leaf, 0.9);
    blit(ctx, layout, tile.x, tile.y, 0, color, "slab", 1.05);
  }
  drawSky(ctx, layout, palette);
  return canvas;
}

function drawSky(ctx: CanvasRenderingContext2D, layout: IsoLayout, palette: TownPalette) {
  const night = luminance(palette.sky) < 0.35;
  const puff = night ? palette.paper : palette.card;
  const clouds = [
    [1.3, 0.15, 2.55, 0.62],
    [1.85, 0.4, 2.75, 0.42],
    [4.4, 0.05, 2.85, 0.7],
    [5.05, 0.35, 2.6, 0.4],
    [8.4, 0.1, 2.7, 0.58],
  ];
  for (const [x, y, z, scale] of clouds) {
    blit(ctx, layout, x!, y!, z!, puff, "head", scale!);
  }
  if (night) {
    blit(ctx, layout, 10.4, 0.15, 3.1, palette.paper, "head", 0.46);
    for (const star of [
      [2.4, 0.8],
      [7.2, 0.4],
      [9.1, 1.1],
    ]) {
      blit(ctx, layout, star[0]!, star[1]!, 3.3, palette.paper, "cube", 0.12);
    }
    return;
  }
  blit(ctx, layout, 10.2, 0.2, 3.05, palette.yellow, "head", 0.5);
  blit(ctx, layout, 10.45, 0.05, 3.2, shade(palette.yellow, 1.05), "cube", 0.28);
}

export function paintTown(
  ctx: CanvasRenderingContext2D,
  floor: CanvasImageSource,
  view: { width: number; height: number },
  layout: IsoLayout,
  palette: TownPalette,
  cars: readonly PaintCar[],
  phase: LightPhase,
  reduced: boolean,
  dpr: number,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.drawImage(floor, 0, 0, view.width, view.height);

  const byId = new Map(cars.map((car) => [car.id, car]));
  const props = new Map(TOWN_PROPS.map((prop) => [prop.id, prop]));
  for (const piece of piecesForFrame(cars.map((car) => car.agent))) {
    if (piece.kind === "car") {
      const car = byId.get(piece.id);
      if (car) drawCar(ctx, layout, palette, car, reduced);
      continue;
    }
    const prop = props.get(piece.propId);
    if (!prop) continue;
    drawProp(ctx, layout, palette, prop, piece.gx, piece.gy, piece.lx, piece.ly, phase);
  }
}

function blit(
  ctx: CanvasRenderingContext2D,
  layout: IsoLayout,
  gx: number,
  gy: number,
  z: number,
  color: string,
  shape: ShapeId,
  scale: number,
) {
  const sprite = blockSprite(color, shape);
  const point = projectIso(gx, gy, z, layout);
  const s = (layout.tw / sprite.tw) * scale;
  ctx.drawImage(
    sprite.canvas,
    point.x - sprite.ax * s,
    point.y - sprite.ay * s,
    sprite.logicalW * s,
    sprite.logicalH * s,
  );
}

function blitShadow(ctx: CanvasRenderingContext2D, layout: IsoLayout, gx: number, gy: number, scale: number) {
  const sprite = shadowSprite();
  const point = projectIso(gx, gy, 0, layout);
  const s = (layout.tw / sprite.tw) * scale;
  ctx.drawImage(
    sprite.canvas,
    point.x - sprite.ax * s,
    point.y - sprite.ay * s,
    sprite.logicalW * s,
    sprite.logicalH * s,
  );
}

function drawProp(
  ctx: CanvasRenderingContext2D,
  layout: IsoLayout,
  palette: TownPalette,
  prop: TownProp,
  gx: number,
  gy: number,
  lx: number,
  ly: number,
  phase: LightPhase,
) {
  const put: Put = (x, y, z, color, shape, scale) => blit(ctx, layout, gx + x, gy + y, z, color, shape, scale);
  if (prop.kind === "house") drawHouse(put, palette, prop, lx, ly);
  else if (prop.kind === "tree") drawTree(put, palette);
  else if (prop.kind === "light") drawLight(put, palette, phase);
  else if (prop.kind === "dirt") drawDirt(put, palette);
  else if (prop.kind === "barrier") drawBarrier(put, palette);
  else if (prop.kind === "bench") drawBench(put, palette);
  else drawFlower(put, palette);
}

function drawHouse(put: Put, palette: TownPalette, prop: TownProp, lx: number, ly: number) {
  const roof =
    prop.roof === "pink" ? palette.pink : prop.roof === "yellow" ? palette.yellow : palette.brand;
  const wall = lx === 0 ? palette.paper : mix(palette.paper, palette.lilac, 0.35);
  put(0.06, 0.06, 0, wall, "cube", 0.9);
  put(0, 0, 0.82, roof, "slab", 1.02);
  if (ly === prop.h - 1 && lx === 0) {
    put(0.34, 0.62, 0.08, palette.brandInk, "cube", 0.22);
    put(0.32, 0.5, 0.48, palette.skyBlue, "cube", 0.24);
  }
}

function drawTree(put: Put, palette: TownPalette) {
  const trunk = mix(palette.brand, palette.brandInk, 0.45);
  put(0.38, 0.38, 0, trunk, "cube", 0.22);
  put(0.38, 0.38, 0.18, trunk, "cube", 0.22);
  put(0.1, 0.1, 0.36, palette.leaf, "head", 0.8);
  put(0.24, 0.18, 0.92, shade(palette.leaf, 1.06), "cube", 0.48);
}

function drawLight(put: Put, palette: TownPalette, phase: LightPhase) {
  put(0.38, 0.38, 0, palette.ink, "cube", 0.2);
  put(0.4, 0.4, 0.22, palette.ink, "cube", 0.16);
  put(0.4, 0.4, 0.46, palette.ink, "cube", 0.16);
  put(0.4, 0.4, 0.7, palette.ink, "cube", 0.16);
  put(0.22, 0.22, 0.96, palette.brandInk, "cube", 0.56);
  const lamps = [
    { z: 1.32, color: palette.pink, on: phase === "stop" },
    { z: 1.16, color: palette.yellow, on: phase === "count" },
    { z: 1.0, color: palette.mint, on: phase === "go" },
  ];
  for (const lamp of lamps) {
    put(0.34, 0.62, lamp.z, lamp.on ? lamp.color : shade(lamp.color, 0.55), "head", lamp.on ? 0.2 : 0.13);
  }
}

function drawDirt(put: Put, palette: TownPalette) {
  const soil = mix(palette.brand, palette.brandInk, 0.35);
  put(0.08, 0.22, 0, soil, "cube", 0.42);
  put(0.36, 0.34, 0.16, shade(soil, 0.9), "head", 0.4);
  put(0.28, 0.18, 0.4, palette.yellow, "cube", 0.2);
}

function drawBarrier(put: Put, palette: TownPalette) {
  put(0.12, 0.34, 0, palette.ink, "cube", 0.16);
  put(0.7, 0.34, 0, palette.ink, "cube", 0.16);
  put(0.12, 0.32, 0.18, palette.yellow, "slab", 0.74);
}

function drawBench(put: Put, palette: TownPalette) {
  put(0.12, 0.4, 0, palette.brandInk, "cube", 0.14);
  put(0.68, 0.4, 0, palette.brandInk, "cube", 0.14);
  put(0.06, 0.28, 0.12, palette.paper, "slab", 0.86);
}

function drawFlower(put: Put, palette: TownPalette) {
  put(0.4, 0.4, 0, palette.leaf, "slab", 0.16);
  put(0.32, 0.32, 0.06, palette.pink, "head", 0.28);
  put(0.4, 0.4, 0.22, palette.yellow, "cube", 0.12);
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  layout: IsoLayout,
  palette: TownPalette,
  car: PaintCar,
  reduced: boolean,
) {
  const origin = agentOrigin(car.agent);
  const moving = car.agent.toward !== null;
  const hop = bounceHeight(car.age, car.index, reduced, moving);
  const closed = eyesClosed(car.age, car.index, reduced);
  const posed = poseFor(car.action, reduced ? 0 : car.age, false);
  const pose = reduced ? { ...posed, paint: 3 as const } : posed;
  const gx = origin.x;
  const gy = origin.y;
  const chubby = 1.28;
  const put: Put = (x, y, z, color, shape, scale) =>
    blit(ctx, layout, gx + x * chubby, gy + y * chubby, z * chubby + hop, color, shape, scale * chubby);
  blitShadow(
    ctx,
    layout,
    gx + 0.42 * chubby,
    gy + 0.48 * chubby,
    (car.character === "lan-ba-shi" ? 1.35 : 1.05) * chubby,
  );
  const blush = mix(palette.pink, palette.brand, 0.42);
  const colors = carColors(car.character, pose, palette);

  if (car.character === "watt") {
    drawWatt(put, palette, colors.body, closed, blush);
    return;
  }
  if (car.character === "lan-ba-shi") {
    drawBus(put, palette, colors, closed, blush);
    return;
  }

  drawWheels(put, palette.ink, car.character === "monster-truck" ? 0.4 : 0.26, car.character === "monster-truck" ? 0 : 0.02);
  const bodyZ = car.character === "monster-truck" ? 0.28 : 0.16;
  put(0.08, 0.12, bodyZ, colors.body, "body", 0.86);
  if (car.character === "hui-hui") put(0.02, 0.02, bodyZ + 0.08, mix(palette.card, palette.ink, 0.2), "cube", 0.36);
  if (car.character === "an-an") {
    put(0.62, 0.28, bodyZ + 0.16, palette.pink, "slab", 0.22);
    put(0.55, 0.36, bodyZ + 0.22, palette.pink, "cube", 0.16);
  }
  if (car.character === "xiao-hong") {
    put(0.22, 0.18, bodyZ + 0.2, palette.paper, "slab", 0.22);
    drawNumberTwo(put, palette.brandInk, bodyZ);
  }

  const headZ = bodyZ + 0.36;
  put(0.02, 0.2, headZ, colors.head, "head", 1.02);
  drawFace(put, 0.02, 0.2, headZ, 1.02, palette, blush, closed);

  if (car.character === "duo-duo") {
    put(0.18, 0.28, headZ + 0.78, palette.brand, "cube", 0.2);
    put(0.4, 0.22, headZ + 0.84, palette.brand, "cube", 0.26);
    put(0.64, 0.3, headZ + 0.76, palette.brand, "cube", 0.2);
    put(0.36, 0.95, headZ + 0.2, palette.mint, "cube", 0.28);
    if (car.action === "brush-teeth") {
      const swing = reduced ? 0 : Math.sin(pose.brush * Math.PI * 2) * 0.1;
      put(0.72 + swing, 1.05, headZ + 0.34, palette.paper, "slab", 0.16);
      put(0.78 + swing, 1.12, headZ + 0.48, palette.mint, "cube", 0.14);
    }
  }
  if (car.character === "dong-dong" || car.character === "a-ku") drawDig(put, palette, colors.body, pose, car, reduced, bodyZ);
  if (car.character === "diao-che") drawCrane(put, palette, colors.body, pose, reduced, bodyZ);
  if (car.character === "ling-ling") {
    const sweep = reduced ? 0 : Math.sin(pose.sweep * Math.PI * 2) * 0.08;
    put(0.12, 0.95, 0.02, palette.teal, "cube", 0.22);
    put(0.58 + sweep, 0.98, 0.02, palette.mint, "cube", 0.22);
  }
  if (car.character === "xiang-xiang") put(0.04, 0.16, headZ + 0.55, palette.paper, "slab", 1.05);
  if (car.character === "monster-truck") put(0.2, 0.22, headZ + 0.7, palette.brand, "slab", 0.4);
}

function drawWheels(put: Put, ink: string, scale: number, z: number) {
  put(0.08, 0.14, z, ink, "cube", scale);
  put(0.08, 0.62, z, ink, "cube", scale);
  put(0.62, 0.14, z, ink, "cube", scale);
  put(0.62, 0.62, z, ink, "cube", scale);
}

function drawFace(
  put: Put,
  ox: number,
  oy: number,
  oz: number,
  scale: number,
  palette: TownPalette,
  blush: string,
  closed: boolean,
) {
  const eye: ShapeId = closed ? "slab" : "head";
  const front = oy + scale * 0.62;
  const ez = oz + scale * 0.22;
  const eyeScale = scale * (closed ? 0.22 : 0.36);
  const left = ox + scale * 0.06;
  const right = ox + scale * 0.56;
  put(left - scale * 0.02, front + scale * 0.08, ez - scale * 0.06, blush, "head", scale * 0.18);
  put(right + scale * 0.22, front + scale * 0.08, ez - scale * 0.06, blush, "head", scale * 0.18);
  put(left, front, ez, palette.paper, eye, eyeScale);
  put(right, front, ez, palette.paper, eye, eyeScale);
  if (!closed) {
    const pupil = eyeScale * 0.38;
    put(left + eyeScale * 0.28, front + eyeScale * 0.35, ez + eyeScale * 0.28, palette.ink, "cube", pupil);
    put(right + eyeScale * 0.28, front + eyeScale * 0.35, ez + eyeScale * 0.28, palette.ink, "cube", pupil);
  }
  put(left + scale * 0.02, front - scale * 0.04, ez + eyeScale * 0.72, palette.brandInk, "slab", scale * 0.2);
  put(right + scale * 0.02, front - scale * 0.04, ez + eyeScale * 0.72, palette.brandInk, "slab", scale * 0.2);
}

function drawNumberTwo(put: Put, color: string, bodyZ: number) {
  const cells: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [0, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ];
  for (const [col, row] of cells) {
    put(0.7, 0.16 + col * 0.11, bodyZ + 0.46 - row * 0.075, color, "cube", 0.1);
  }
}

function drawDig(
  put: Put,
  palette: TownPalette,
  color: string,
  pose: BoardPose,
  car: PaintCar,
  reduced: boolean,
  bodyZ: number,
) {
  if (car.character === "a-ku") {
    const spin = reduced ? 0 : Math.sin(car.age * 10) * 0.05;
    put(0.34, 0.9, bodyZ, color, "cube", 0.28);
    put(0.4 + spin, 1.08, bodyZ + 0.04, palette.brand, "cube", 0.2);
    put(0.46 + spin, 1.22, bodyZ + 0.08, palette.paper, "cube", 0.12);
    return;
  }
  const dig = reduced ? 0.25 : pose.dig;
  put(0.72, 0.2, bodyZ + 0.28, color, "cube", 0.2);
  put(0.86, 0.08 + dig * 0.15, bodyZ + 0.48 + dig * 0.2, color, "slab", 0.32);
  put(0.98, 0.4, bodyZ + 0.22, palette.brandInk, "cube", 0.18);
}

function drawCrane(put: Put, palette: TownPalette, color: string, pose: BoardPose, reduced: boolean, bodyZ: number) {
  const lift = reduced ? 0.4 : 0.25 + pose.dig * 0.7;
  put(0.2, 0.2, bodyZ + 0.42, palette.ink, "cube", 0.16);
  put(0.2, 0.2, bodyZ + 0.58, palette.ink, "slab", 0.16);
  put(0.2, 0.2, bodyZ + 0.86, color, "slab", 0.16 + lift * 0.2);
  put(0.18, 0.18, bodyZ + 1.15, color, "slab", 0.7);
  put(0.7, 0.55, bodyZ + 0.95, palette.ink, "cube", 0.1);
}

function drawBus(
  put: Put,
  palette: TownPalette,
  colors: { body: string; head: string },
  closed: boolean,
  blush: string,
) {
  drawWheels(put, palette.ink, 0.24, 0);
  put(0.7, 0.16, 0, palette.ink, "cube", 0.24);
  put(0, 0.14, 0.14, colors.body, "body", 0.72);
  put(0.58, 0.14, 0.14, colors.body, "body", 0.72);
  put(0.18, 0.28, 0.14, palette.paper, "cube", 0.2);
  put(0.72, 0.28, 0.14, palette.paper, "cube", 0.2);
  put(0.22, 0.22, 0.46, colors.head, "head", 0.95);
  drawFace(put, 0.22, 0.22, 0.46, 0.95, palette, blush, closed);
}

function drawWatt(put: Put, palette: TownPalette, color: string, closed: boolean, blush: string) {
  put(0.18, 0.4, 0, color, "cube", 0.22);
  put(0.64, 0.4, 0, color, "cube", 0.22);
  put(0.14, 0.22, 0.16, color, "body", 0.74);
  put(0, 0.18, 0.5, color, "head", 1.12);
  drawFace(put, 0, 0.18, 0.5, 1.12, palette, blush, closed);
  put(0.48, 0.42, 1.32, palette.yellow, "cube", 0.14);
  put(0.5, 0.44, 1.16, palette.ink, "slab", 0.08);
}

function carColors(
  character: BoardCharacterId,
  pose: BoardPose,
  palette: TownPalette,
): { body: string; head: string } {
  if (character === "hui-hui") {
    const self = mix(palette.card, palette.ink, 0.22);
    const paints = [palette.pink, palette.skyBlue, palette.yellow, self];
    const color = paints[pose.paint] ?? self;
    return { body: color, head: color };
  }
  if (character === "duo-duo") return { body: palette.leaf, head: palette.leaf };
  if (character === "xiao-hong" || character === "xiang-xiang") {
    const color = character === "xiang-xiang" ? mix(palette.pink, palette.brand, 0.22) : palette.pink;
    return { body: color, head: color };
  }
  if (character === "dong-dong") return { body: palette.yellow, head: palette.yellow };
  if (character === "diao-che") {
    const color = mix(palette.yellow, palette.brand, 0.22);
    return { body: color, head: color };
  }
  if (character === "monster-truck") {
    const color = mix(palette.yellow, palette.brand, 0.4);
    return { body: color, head: color };
  }
  if (character === "a-ku") {
    const color = mix(palette.yellow, palette.paper, 0.18);
    return { body: color, head: color };
  }
  if (character === "ling-ling") {
    const color = mix(palette.mint, palette.teal, 0.4);
    return { body: color, head: color };
  }
  if (character === "an-an") return { body: palette.paper, head: palette.paper };
  if (character === "lan-ba-shi") return { body: palette.skyBlue, head: palette.skyBlue };
  return { body: palette.teal, head: palette.teal };
}

export function luminance(color: string): number {
  const rgb = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  const hex = color.trim().match(/^#([\da-f]{6})$/i);
  let r = 212;
  let g = 236;
  let b = 255;
  if (hex?.[1]) {
    const n = Number.parseInt(hex[1], 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  } else if (rgb) {
    r = Number(rgb[1]);
    g = Number(rgb[2]);
    b = Number(rgb[3]);
  }
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
