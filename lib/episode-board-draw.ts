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

type Mood = "friendly" | "eager" | "shy" | "cool" | "kind" | "polite";

function moodOf(character: BoardCharacterId): Mood {
  if (character === "xiao-hong") return "eager";
  if (character === "dong-dong" || character === "hui-hui") return "shy";
  if (character === "a-ku") return "cool";
  if (character === "watt") return "polite";
  if (character === "diao-che" || character === "an-an" || character === "lan-ba-shi") return "kind";
  return "friendly";
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
  const put: Put = (x, y, z, color, shape, scale) =>
    blit(ctx, layout, gx + x, gy + y, z + hop, color, shape, scale);
  const long = car.character !== "duo-duo" && car.character !== "watt" && car.character !== "dong-dong";
  blitShadow(ctx, layout, gx + (long ? 0.85 : 0.42), gy + 0.48, long ? 1.45 : 0.95);
  const blush = mix(palette.pink, palette.brand, 0.42);
  const colors = carColors(car.character, pose, palette);
  const face = (ox: number, oy: number, oz: number, scale: number) =>
    drawFace(put, ox, oy, oz, scale, palette, blush, closed, moodOf(car.character), car.character === "diao-che");

  switch (car.character) {
    case "duo-duo":
      drawDuoDuo(put, palette, face, pose, car.action === "brush-teeth", reduced);
      break;
    case "xiao-hong":
      drawRacer(put, palette, face);
      break;
    case "hui-hui":
      drawBoxTruck(put, palette, colors.body, face);
      break;
    case "a-ku":
      drawDrill(put, palette, pose, car, reduced, face);
      break;
    case "xiang-xiang":
      drawFoodTruck(put, palette, face);
      break;
    case "monster-truck":
      drawMonster(put, palette, face);
      break;
    case "an-an":
      drawAmbulance(put, palette, face);
      break;
    case "dong-dong":
      drawExcavator(put, palette, pose, reduced, face);
      break;
    case "diao-che":
      drawCraneTruck(put, palette, pose, reduced, face);
      break;
    case "ling-ling":
      drawSweeper(put, palette, pose, reduced, face);
      break;
    case "lan-ba-shi":
      drawBus(put, palette, face);
      break;
    default:
      drawWatt(put, palette, face);
  }
}

function drawDuoDuo(
  put: Put,
  palette: TownPalette,
  face: (ox: number, oy: number, oz: number, scale: number) => void,
  pose: BoardPose,
  brushing: boolean,
  reduced: boolean,
) {
  drawWheels(put, palette.ink, 0.22, 0.02, 0.55);
  put(0.1, 0.16, 0.14, palette.leaf, "body", 0.72);
  put(0.55, 0.28, 0.22, palette.skyBlue, "cube", 0.22);
  put(0.02, 0.08, 0.42, palette.leaf, "head", 0.92);
  put(0.22, 0.72, 0.48, palette.mint, "cube", 0.42);
  put(0.34, 0.95, 0.4, palette.brandInk, "slab", 0.22);
  put(0.38, 0.9, 0.48, palette.yellow, "cube", 0.12);
  put(0.12, 0.18, 1.05, palette.brand, "cube", 0.28);
  put(0.38, 0.12, 1.16, palette.brand, "cube", 0.34);
  put(0.64, 0.2, 1.02, palette.brand, "cube", 0.26);
  face(0.08, 0.22, 0.5, 0.72);
  if (brushing) {
    const swing = reduced ? 0 : Math.sin(pose.brush * Math.PI * 2) * 0.12;
    put(0.78 + swing, 0.85, 0.55, palette.paper, "slab", 0.16);
    put(0.82 + swing, 0.95, 0.78, palette.skyBlue, "cube", 0.28);
  }
}

function drawRacer(put: Put, palette: TownPalette, face: (ox: number, oy: number, oz: number, scale: number) => void) {
  drawWheels(put, palette.ink, 0.2, 0, 1.35);
  put(0.05, 0.28, 0.12, palette.pink, "slab", 0.78);
  put(0.78, 0.22, 0.1, palette.pink, "slab", 0.86);
  put(0.28, 0.32, 0.28, palette.paper, "slab", 0.7);
  put(0.15, 0.18, 0.42, palette.ink, "cube", 0.28);
  put(1.15, 0.55, 0.22, palette.yellow, "cube", 0.18);
  put(1.15, 0.78, 0.22, palette.yellow, "cube", 0.18);
  put(0.95, 0.4, 0.28, palette.skyBlue, "cube", 0.22);
  drawNumberTwo(put, 0.42, 0.18, 0.18);
  face(0.85, 0.38, 0.22, 0.48);
}

function drawBoxTruck(
  put: Put,
  palette: TownPalette,
  cargo: string,
  face: (ox: number, oy: number, oz: number, scale: number) => void,
) {
  drawWheels(put, palette.ink, 0.22, 0, 1.2);
  put(0.02, 0.18, 0.16, cargo, "cube", 0.92);
  put(0.08, 0.28, 0.95, palette.pink, "slab", 0.28);
  put(0.55, 0.42, 1.05, palette.yellow, "cube", 0.16);
  put(0.88, 0.22, 0.16, palette.skyBlue, "body", 0.62);
  face(0.92, 0.28, 0.28, 0.5);
}

function drawDrill(
  put: Put,
  palette: TownPalette,
  pose: BoardPose,
  car: PaintCar,
  reduced: boolean,
  face: (ox: number, oy: number, oz: number, scale: number) => void,
) {
  const spin = reduced ? 0 : Math.sin(car.age * 8 + pose.dig * 6) * 0.06;
  put(0.08, 0.22, 0.02, palette.ink, "slab", 0.72);
  put(0.08, 0.55, 0.02, palette.ink, "slab", 0.72);
  put(0.18, 0.28, 0.08, palette.yellow, "cube", 0.16);
  put(0.42, 0.28, 0.08, palette.yellow, "cube", 0.16);
  put(0.12, 0.2, 0.16, mix(palette.card, palette.ink, 0.35), "cube", 0.7);
  face(0.16, 0.28, 0.28, 0.52);
  put(0.7, 0.28, 0.2, palette.yellow, "cube", 0.42);
  put(0.95 + spin, 0.36, 0.28, palette.brandInk, "cube", 0.48);
  put(1.2 + spin, 0.46, 0.36, palette.ink, "cube", 0.32);
  put(1.4 + spin, 0.54, 0.44, palette.paper, "cube", 0.18);
}

function drawFoodTruck(put: Put, palette: TownPalette, face: (ox: number, oy: number, oz: number, scale: number) => void) {
  drawWheels(put, palette.ink, 0.22, 0, 1.15);
  put(0.04, 0.34, 0.12, palette.mint, "slab", 0.9);
  put(0.82, 0.28, 0.12, palette.mint, "slab", 0.72);
  put(0.08, 0.22, 0.28, palette.pink, "cube", 0.82);
  put(0.22, 0.4, 0.42, palette.brandInk, "cube", 0.42);
  put(0.3, 0.48, 0.55, palette.leaf, "cube", 0.16);
  put(0.42, 0.5, 0.52, palette.leaf, "cube", 0.14);
  put(0.02, 0.18, 0.95, palette.paper, "slab", 0.42);
  put(0.38, 0.16, 0.98, palette.pink, "slab", 0.42);
  put(0.72, 0.18, 0.95, palette.paper, "slab", 0.38);
  put(0.95, 0.3, 0.32, palette.skyBlue, "cube", 0.4);
  face(1.0, 0.36, 0.28, 0.42);
}

function drawMonster(put: Put, palette: TownPalette, face: (ox: number, oy: number, oz: number, scale: number) => void) {
  const wheel = 0.58;
  put(0.02, 0.08, 0, palette.ink, "cube", wheel);
  put(0.02, 0.55, 0, palette.ink, "cube", wheel);
  put(0.95, 0.02, 0, palette.ink, "cube", wheel);
  put(0.95, 0.58, 0, palette.ink, "cube", wheel);
  put(0.16, 0.22, 0.18, palette.yellow, "cube", 0.18);
  put(1.08, 0.16, 0.18, palette.yellow, "cube", 0.18);
  put(0.12, 0.18, 0.48, mix(palette.yellow, palette.brand, 0.35), "cube", 0.95);
  put(0.2, 0.28, 1.15, palette.ink, "slab", 0.7);
  put(0.28, 0.32, 1.28, palette.yellow, "cube", 0.14);
  put(0.48, 0.32, 1.28, palette.yellow, "cube", 0.14);
  put(0.68, 0.32, 1.28, palette.yellow, "cube", 0.14);
  face(0.28, 0.32, 0.62, 0.55);
}

function drawAmbulance(put: Put, palette: TownPalette, face: (ox: number, oy: number, oz: number, scale: number) => void) {
  drawWheels(put, palette.ink, 0.22, 0, 1.2);
  put(0.04, 0.2, 0.14, palette.paper, "cube", 0.78);
  put(0.72, 0.16, 0.14, palette.paper, "cube", 0.82);
  put(0.1, 0.28, 0.42, palette.pink, "slab", 0.62);
  put(0.28, 0.22, 0.28, palette.pink, "cube", 0.28);
  put(0.22, 0.18, 0.95, palette.pink, "cube", 0.22);
  put(0.48, 0.18, 0.95, palette.pink, "cube", 0.22);
  put(1.05, 0.55, 0.22, palette.yellow, "cube", 0.16);
  face(0.82, 0.28, 0.32, 0.5);
}

function drawExcavator(
  put: Put,
  palette: TownPalette,
  pose: BoardPose,
  reduced: boolean,
  face: (ox: number, oy: number, oz: number, scale: number) => void,
) {
  const dig = reduced ? 0.35 : pose.dig;
  put(0.06, 0.2, 0.02, palette.ink, "slab", 0.78);
  put(0.06, 0.52, 0.02, palette.ink, "slab", 0.78);
  put(0.14, 0.28, 0.14, palette.yellow, "cube", 0.62);
  face(0.18, 0.36, 0.28, 0.46);
  put(0.42, 0.22, 0.55, palette.yellow, "cube", 0.28);
  put(0.55, 0.08, 0.72 + dig * 0.35, palette.yellow, "slab", 0.62);
  put(0.78, 0.42, 0.42 + dig * 0.15, palette.brandInk, "cube", 0.32);
}

function drawCraneTruck(
  put: Put,
  palette: TownPalette,
  pose: BoardPose,
  reduced: boolean,
  face: (ox: number, oy: number, oz: number, scale: number) => void,
) {
  const lift = reduced ? 0.45 : 0.2 + pose.dig * 0.8;
  drawWheels(put, palette.ink, 0.2, 0, 1.45);
  put(0.55, 0.42, 0, palette.ink, "cube", 0.2);
  put(0.02, 0.28, 0.12, mix(palette.card, palette.ink, 0.28), "slab", 0.85);
  put(0.78, 0.24, 0.12, palette.brand, "cube", 0.7);
  face(0.84, 0.32, 0.28, 0.48);
  put(0.28, 0.3, 0.28, palette.brand, "cube", 0.22);
  put(0.3, 0.32, 0.48, palette.brand, "cube", 0.18);
  put(0.3, 0.32, 0.72, palette.brand, "cube", 0.18);
  put(0.3, 0.32, 1.05, palette.brand, "cube", 0.18);
  put(0.22, 0.24, 1.35, palette.brand, "slab", 0.85 + lift * 0.35);
  put(0.85, 0.48, 1.15, mix(palette.card, palette.ink, 0.45), "cube", 0.16);
  put(0.88, 0.5, 0.85, palette.ink, "slab", 0.1);
}

function drawSweeper(
  put: Put,
  palette: TownPalette,
  pose: BoardPose,
  reduced: boolean,
  face: (ox: number, oy: number, oz: number, scale: number) => void,
) {
  const sweep = reduced ? 0 : Math.sin(pose.sweep * Math.PI * 2) * 0.08;
  drawWheels(put, palette.ink, 0.2, 0, 1.05);
  put(0.02, 0.4, 0.12, palette.leaf, "slab", 0.95);
  put(0.7, 0.28, 0.16, palette.paper, "cube", 0.7);
  face(0.76, 0.36, 0.32, 0.48);
  put(0.2, 0.22, 0.85, palette.brand, "slab", 0.55);
  put(0.55, 0.3, 0.95, palette.ink, "cube", 0.32);
  put(0.62, 0.38, 1.15, palette.pink, "slab", 0.16);
  put(0.15, 0.72 + sweep, 0.02, palette.yellow, "head", 0.42);
  put(0.55, 0.78 - sweep, 0.02, palette.yellow, "head", 0.42);
}

function drawWheels(put: Put, ink: string, scale: number, z: number, span: number) {
  put(0.04, 0.12, z, ink, "cube", scale);
  put(0.04, 0.62, z, ink, "cube", scale);
  put(span - scale * 0.2, 0.08, z, ink, "cube", scale);
  put(span - scale * 0.2, 0.62, z, ink, "cube", scale);
}

type FaceFn = (ox: number, oy: number, oz: number, scale: number) => void;

function drawBus(put: Put, palette: TownPalette, face: FaceFn) {
  drawWheels(put, palette.ink, 0.2, 0, 1.55);
  put(0.9, 0.55, 0, palette.ink, "cube", 0.2);
  put(0, 0.22, 0.16, palette.skyBlue, "cube", 0.72);
  put(0.62, 0.18, 0.16, palette.skyBlue, "cube", 0.78);
  put(1.15, 0.16, 0.14, palette.paper, "slab", 0.55);
  put(0.12, 0.3, 0.38, palette.skyBlue, "cube", 0.22);
  put(0.4, 0.28, 0.38, palette.skyBlue, "cube", 0.22);
  put(0.7, 0.26, 0.4, palette.paper, "cube", 0.2);
  put(0.95, 0.24, 0.4, palette.paper, "cube", 0.2);
  put(0.35, 0.2, 0.95, palette.skyBlue, "head", 0.28);
  put(1.2, 0.48, 0.22, palette.yellow, "cube", 0.16);
  put(1.2, 0.7, 0.22, palette.brand, "cube", 0.12);
  face(0.7, 0.28, 0.32, 0.5);
}

function drawWatt(put: Put, palette: TownPalette, face: FaceFn) {
  put(0.12, 0.42, 0, palette.teal, "cube", 0.24);
  put(0.58, 0.42, 0, palette.teal, "cube", 0.24);
  put(0.16, 0.28, 0.2, palette.teal, "body", 0.62);
  put(-0.02, 0.12, 0.48, palette.teal, "head", 1.05);
  face(0.08, 0.22, 0.58, 0.72);
  put(0.42, 0.4, 1.28, palette.ink, "slab", 0.08);
  put(0.38, 0.36, 1.4, palette.yellow, "cube", 0.18);
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
  mood: Mood,
  mustache: boolean,
) {
  const shy = mood === "shy";
  const cool = mood === "cool";
  const eager = mood === "eager";
  const polite = mood === "polite";
  const eye: ShapeId = closed ? "slab" : "head";
  const front = oy + scale * 0.58;
  const ez = oz + scale * (shy ? 0.12 : 0.2);
  const eyeScale = scale * (closed ? 0.18 : shy || polite ? 0.26 : cool ? 0.3 : 0.4);
  const left = ox + scale * 0.04;
  const right = ox + scale * 0.52;
  const blushScale = scale * (shy ? 0.26 : cool ? 0.1 : 0.16);
  put(left - scale * 0.06, front + scale * 0.12, ez - scale * 0.08, blush, "head", blushScale);
  put(right + scale * 0.22, front + scale * 0.12, ez - scale * 0.08, blush, "head", blushScale);
  put(left, front, ez, palette.paper, eye, eyeScale);
  put(right, front, ez, palette.paper, eye, eyeScale);
  if (!closed) {
    const pupil = eyeScale * (cool ? 0.32 : 0.36);
    const drop = shy ? eyeScale * 0.15 : 0;
    put(left + eyeScale * 0.3, front + eyeScale * 0.32, ez + eyeScale * 0.22 - drop, palette.ink, "cube", pupil);
    put(right + eyeScale * 0.3, front + eyeScale * 0.32, ez + eyeScale * 0.22 - drop, palette.ink, "cube", pupil);
  }
  const brow = cool ? scale * 0.28 : scale * 0.16;
  const browZ = ez + eyeScale * (eager ? 0.85 : shy ? 0.95 : 0.78);
  put(left, front - scale * 0.02, browZ + (eager ? scale * 0.08 : 0), palette.brandInk, "slab", brow);
  put(right, front - scale * 0.02, browZ - (eager ? scale * 0.06 : 0), palette.brandInk, "slab", brow);
  const mouthZ = ez - scale * 0.02;
  const mouthY = front + scale * 0.2;
  if (mood === "friendly" || mood === "kind") {
    put(left + scale * 0.12, mouthY, mouthZ, palette.brandInk, "slab", scale * 0.34);
  } else if (eager) {
    put(left + scale * 0.22, mouthY, mouthZ + scale * 0.06, palette.brandInk, "cube", scale * 0.14);
  } else if (cool) {
    put(left + scale * 0.16, mouthY, mouthZ + scale * 0.04, palette.ink, "slab", scale * 0.22);
  } else if (shy) {
    put(left + scale * 0.24, mouthY, mouthZ, palette.brandInk, "cube", scale * 0.1);
  } else {
    put(left + scale * 0.2, mouthY, mouthZ, palette.brandInk, "slab", scale * 0.18);
  }
  if (mustache) {
    put(left + scale * 0.02, mouthY + scale * 0.04, mouthZ + scale * 0.08, mix(palette.card, palette.ink, 0.55), "slab", scale * 0.2);
    put(right + scale * 0.02, mouthY + scale * 0.04, mouthZ + scale * 0.08, mix(palette.card, palette.ink, 0.55), "slab", scale * 0.2);
  }
}

function drawNumberTwo(put: Put, x: number, y: number, z: number) {
  put(x - 0.06, y - 0.04, z - 0.04, "rgb(255, 248, 242)", "head", 0.62);
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
    put(x + col * 0.12, y + 0.08, z + 0.42 - row * 0.09, "rgb(58, 36, 16)", "cube", 0.11);
  }
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

/** 十二台並排，給角色表截圖用。車子停在原點，減少動態。 */
export function paintCastSheet(
  ctx: CanvasRenderingContext2D,
  view: { width: number; height: number },
  palette: TownPalette,
  cars: readonly PaintCar[],
  dpr: number,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = palette.sky;
  ctx.fillRect(0, 0, view.width, view.height);
  const count = Math.max(1, cars.length);
  const tw = Math.min(view.width / (count * 2.35), view.height * 0.18);
  const layoutBase: IsoLayout = { ox: 0, oy: 0, tw, th: tw / 2, zh: tw * 1.15 };
  cars.forEach((car, index) => {
    const slotX = ((index + 0.5) * view.width) / count;
    const baseline = view.height * 0.56;
    const probe = projectIso(0.55, 0.4, 0, layoutBase);
    const layout: IsoLayout = {
      ...layoutBase,
      ox: slotX - probe.x,
      oy: baseline - probe.y,
    };
    const agent: TownAgent = {
      ...car.agent,
      home: { x: 0, y: 0 },
      leg: 0,
      toward: null,
      progress: 0,
    };
    drawCar(ctx, layout, palette, { ...car, agent, age: 0 }, true);
  });
}

export function castAnchor(
  index: number,
  count: number,
  view: { width: number; height: number },
): { x: number; y: number } {
  const safe = Math.max(1, count);
  return {
    x: ((index + 0.5) * view.width) / safe,
    y: view.height * 0.56,
  };
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
