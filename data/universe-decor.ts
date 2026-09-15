import {
  MAP_STAGE,
  MAP_STAGE_PORTRAIT,
  type MapLayout,
  type MapStage,
} from "@/data/universe-zones";

export type DecorKind = "bird" | "sailboat" | "fish" | "firefly";

type DecorBase = {
  id: string;
  kind: DecorKind;
  x: number;
  y: number;
  size: number;
  periodMs: number;
  delayMs?: number;
  /** 純移動型在 reduced-motion 時不渲染 */
  movingOnly?: boolean;
  /** 僅夜間渲染（螢火） */
  nightOnly?: boolean;
};

export type DecorItem =
  | (DecorBase & { motion: "drift" | "bob" })
  | (DecorBase & { motion: "path"; travel: number });

// 座標對齊有機佈局（car-park 410,495；dino 175,300；forest 580,175；
// rescue 785,300；ocean 825,560）：填充件落在島間水域與邊緣，避開島 tile 與旅程橋線。
// 紅色浮標已移除（視覺噪音）。
export const MAP_DECOR: DecorItem[] = [
  { id: "boat-1", kind: "sailboat", x: 110, y: 630, size: 1, motion: "bob", periodMs: 3200 },
  { id: "fish-1", kind: "fish", x: 480, y: 660, size: 0.7, motion: "path", periodMs: 9000, travel: 120 },
  {
    id: "bird-1",
    kind: "bird",
    x: 110,
    y: 50,
    size: 0.8,
    motion: "path",
    periodMs: 14000,
    travel: 260,
    movingOnly: true,
  },
  {
    id: "bird-2",
    kind: "bird",
    x: 680,
    y: 70,
    size: 0.6,
    motion: "path",
    periodMs: 17000,
    travel: 220,
    movingOnly: true,
    delayMs: 3000,
  },
  {
    id: "firefly-1",
    kind: "firefly",
    x: 620,
    y: 440,
    size: 0.5,
    motion: "drift",
    periodMs: 8000,
    movingOnly: true,
    nightOnly: true,
  },
  {
    id: "firefly-2",
    kind: "firefly",
    x: 200,
    y: 430,
    size: 0.4,
    motion: "bob",
    periodMs: 4200,
    delayMs: 600,
    movingOnly: true,
    nightOnly: true,
  },
  {
    id: "firefly-3",
    kind: "firefly",
    x: 960,
    y: 430,
    size: 0.45,
    motion: "drift",
    periodMs: 9500,
    delayMs: 1200,
    movingOnly: true,
    nightOnly: true,
  },

  // ── 海面密度包：填島間水域與四邊留白，避開島 tile、標籤帶與旅程橋線。
  { id: "boat-2", kind: "sailboat", x: 620, y: 640, size: 0.85, motion: "bob", periodMs: 3600, delayMs: 900 },
  { id: "boat-3", kind: "sailboat", x: 330, y: 620, size: 0.7, motion: "bob", periodMs: 4000, delayMs: 1600 },
  { id: "fish-2", kind: "fish", x: 700, y: 650, size: 0.6, motion: "path", periodMs: 10000, travel: 100, delayMs: 1400 },
  { id: "fish-3", kind: "fish", x: 180, y: 560, size: 0.55, motion: "path", periodMs: 8500, travel: 90, delayMs: 2000 },
  {
    id: "bird-3",
    kind: "bird",
    x: 250,
    y: 60,
    size: 0.7,
    motion: "path",
    periodMs: 15000,
    travel: 240,
    movingOnly: true,
    delayMs: 6000,
  },
  {
    id: "bird-4",
    kind: "bird",
    x: 940,
    y: 90,
    size: 0.55,
    motion: "path",
    periodMs: 19000,
    travel: 200,
    movingOnly: true,
    delayMs: 9000,
  },
  {
    id: "firefly-4",
    kind: "firefly",
    x: 520,
    y: 640,
    size: 0.5,
    motion: "drift",
    periodMs: 8800,
    delayMs: 2400,
    movingOnly: true,
    nightOnly: true,
  },
  {
    id: "firefly-5",
    kind: "firefly",
    x: 150,
    y: 600,
    size: 0.4,
    motion: "bob",
    periodMs: 5000,
    delayMs: 900,
    movingOnly: true,
    nightOnly: true,
  },
];

/**
 * 直式舞台（720×1400）的填充件：座標對齊直式五島
 * （forest 360,235；dino 175,580；rescue 545,600；car-park 360,980；ocean 330,1310），
 * 落在島間水域與邊緣，避開 tile 與六條橋。橫式那組座標若直接沿用，
 * 鳥／船會落在直式舞台外或壓在島上（工程審 (2)）。
 */
export const MAP_DECOR_PORTRAIT: DecorItem[] = [
  { id: "p-boat-1", kind: "sailboat", x: 100, y: 250, size: 1, motion: "bob", periodMs: 3200 },
  { id: "p-boat-2", kind: "sailboat", x: 610, y: 300, size: 0.9, motion: "bob", periodMs: 3600, delayMs: 800 },
  { id: "p-boat-3", kind: "sailboat", x: 620, y: 760, size: 0.85, motion: "bob", periodMs: 3400, delayMs: 1500 },
  { id: "p-fish-1", kind: "fish", x: 90, y: 800, size: 0.7, motion: "path", periodMs: 9000, travel: 80 },
  { id: "p-fish-2", kind: "fish", x: 600, y: 1000, size: 0.6, motion: "path", periodMs: 11000, travel: 90, delayMs: 2000 },
  { id: "p-fish-3", kind: "fish", x: 560, y: 1250, size: 0.7, motion: "path", periodMs: 10000, travel: 100, delayMs: 4000 },
  {
    id: "p-bird-1",
    kind: "bird",
    x: 60,
    y: 60,
    size: 0.8,
    motion: "path",
    periodMs: 14000,
    travel: 160,
    movingOnly: true,
  },
  {
    id: "p-bird-2",
    kind: "bird",
    x: 520,
    y: 80,
    size: 0.6,
    motion: "path",
    periodMs: 17000,
    travel: 150,
    movingOnly: true,
    delayMs: 3000,
  },
  {
    id: "p-firefly-1",
    kind: "firefly",
    x: 110,
    y: 700,
    size: 0.5,
    motion: "drift",
    periodMs: 8000,
    movingOnly: true,
    nightOnly: true,
  },
  {
    id: "p-firefly-2",
    kind: "firefly",
    x: 640,
    y: 900,
    size: 0.5,
    motion: "drift",
    periodMs: 7000,
    delayMs: 1200,
    movingOnly: true,
    nightOnly: true,
  },
  {
    id: "p-firefly-3",
    kind: "firefly",
    x: 100,
    y: 1200,
    size: 0.45,
    motion: "drift",
    periodMs: 9000,
    delayMs: 600,
    movingOnly: true,
    nightOnly: true,
  },
  {
    id: "p-firefly-4",
    kind: "firefly",
    x: 600,
    y: 1330,
    size: 0.5,
    motion: "drift",
    periodMs: 7500,
    delayMs: 2100,
    movingOnly: true,
    nightOnly: true,
  },
];

/** 依版面取填充件；`getMapDecor()` ≡ `MAP_DECOR`。 */
export function getMapDecor(layout: MapLayout = "landscape"): DecorItem[] {
  return layout === "portrait" ? MAP_DECOR_PORTRAIT : MAP_DECOR;
}

/** stage 邊界（供測試與驗證用） */
export const MAP_DECOR_BOUNDS = MAP_STAGE;

export function getMapDecorBounds(layout: MapLayout = "landscape"): MapStage {
  return layout === "portrait" ? MAP_STAGE_PORTRAIT : MAP_STAGE;
}
