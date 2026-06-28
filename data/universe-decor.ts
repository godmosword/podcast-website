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
];

/** stage 邊界（供測試與驗證用） */
export const MAP_DECOR_BOUNDS = MAP_STAGE;
