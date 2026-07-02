import { MAP_STAGE } from "@/data/universe-zones";

export type DecorKind = "bird" | "sailboat" | "fish" | "buoy" | "firefly";
export type DecorMotion = "drift" | "bob" | "path";

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

export const MAP_DECOR: DecorItem[] = [
  { id: "boat-1", kind: "sailboat", x: 180, y: 470, size: 1, motion: "bob", periodMs: 3200 },
  {
    id: "buoy-1",
    kind: "buoy",
    x: 690,
    y: 430,
    size: 0.8,
    motion: "bob",
    periodMs: 2600,
    delayMs: 400,
  },
  { id: "fish-1", kind: "fish", x: 430, y: 560, size: 0.7, motion: "path", periodMs: 9000, travel: 120 },
  {
    id: "bird-1",
    kind: "bird",
    x: 120,
    y: 120,
    size: 0.8,
    motion: "path",
    periodMs: 14000,
    travel: 260,
    movingOnly: true,
  },
  {
    id: "bird-2",
    kind: "bird",
    x: 640,
    y: 90,
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
    x: 520,
    y: 420,
    size: 0.5,
    motion: "drift",
    periodMs: 8000,
    movingOnly: true,
    nightOnly: true,
  },
  {
    id: "firefly-2",
    kind: "firefly",
    x: 240,
    y: 310,
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
    x: 820,
    y: 380,
    size: 0.45,
    motion: "drift",
    periodMs: 9500,
    delayMs: 1200,
    movingOnly: true,
    nightOnly: true,
  },

  // ── R-joy 2 海面密度包：密度由 car-park（500,400）向外遞減，
  //    避開島 tile、標籤帶與橋線；填充件一律不可互動（decor 層本身 pointer-events 無）。
  { id: "boat-2", kind: "sailboat", x: 640, y: 620, size: 0.85, motion: "bob", periodMs: 3600, delayMs: 900 },
  { id: "boat-3", kind: "sailboat", x: 330, y: 150, size: 0.7, motion: "bob", periodMs: 4000, delayMs: 1600 },
  { id: "buoy-2", kind: "buoy", x: 350, y: 480, size: 0.75, motion: "bob", periodMs: 2900, delayMs: 800 },
  { id: "buoy-3", kind: "buoy", x: 600, y: 250, size: 0.7, motion: "bob", periodMs: 3100, delayMs: 300 },
  { id: "buoy-4", kind: "buoy", x: 140, y: 620, size: 0.65, motion: "bob", periodMs: 2700, delayMs: 1200 },
  { id: "fish-2", kind: "fish", x: 700, y: 520, size: 0.6, motion: "path", periodMs: 10000, travel: 100, delayMs: 1400 },
  { id: "fish-3", kind: "fish", x: 250, y: 400, size: 0.55, motion: "path", periodMs: 8500, travel: 90, delayMs: 2000 },
  {
    id: "bird-3",
    kind: "bird",
    x: 400,
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
    x: 880,
    y: 130,
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
    x: 450,
    y: 300,
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
    x: 700,
    y: 470,
    size: 0.4,
    motion: "bob",
    periodMs: 5000,
    delayMs: 900,
    movingOnly: true,
    nightOnly: true,
  },
];

/** stage 邊界（供測試與驗證用） */
export const MAP_DECOR_BOUNDS = MAP_STAGE;
