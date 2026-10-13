/**
 * 多多的外輪廓。三個角度共用同一套刺長，所以背刺不會一長一短。
 * 車頭朝右（正面除外）。沒有手、沒有腳，只有輪子。
 */

export type DuoDuoView = "front" | "three-quarter" | "side";

export type SpikeSpec = { x: number; y: number; deg: number };

export type WheelSpec = { cx: number; cy: number; r: number; far?: boolean };

export type EyeSpec = { cx: number; cy: number; r: number };

export type DuoDuoGeometry = {
  anchorX: number;
  body: string;
  spikes: SpikeSpec[];
  wheels: WheelSpec[];
  window?: { x: number; y: number; w: number; h: number; rx: number };
  eyes: EyeSpec[];
  /** 嘴的中心與縮放。張嘴本體大約 26×14，再乘上這個縮放。 */
  mouth: { cx: number; cy: number; s: number };
  nostrils: Array<{ cx: number; cy: number }>;
  blush: Array<{ cx: number; cy: number }>;
  /** 吻部填色。上緣收進頭殼裡，不另描一刀。 */
  muzzle: string;
  /** 吻部外緣（朝外的那一段），才畫主線。 */
  muzzleEdge: string;
  /** 左上高光的位置（在頭殼上）。 */
  gloss: { cx: number; cy: number; rx: number; ry: number };
  exhaust: { x: number; y: number; w: number; h: number };
  puff: { cx: number; cy: number };
  hearts: Array<{ x: number; y: number; s: number }>;
  stars: Array<{ x: number; y: number; s: number }>;
};

/** 每根刺一樣長、一樣寬，只改生長方向。角度 0° 朝右，-90° 朝上（SVG y 向下）。 */
export const SPIKE_LENGTH = 16;
export const SPIKE_HALF = 5.6;

export function spikePath(spec: SpikeSpec, length = SPIKE_LENGTH, half = SPIKE_HALF): string {
  const rad = (spec.deg * Math.PI) / 180;
  const tipX = spec.x + Math.cos(rad) * length;
  const tipY = spec.y + Math.sin(rad) * length;
  const px = Math.cos(rad + Math.PI / 2) * half;
  const py = Math.sin(rad + Math.PI / 2) * half;
  const lx = spec.x + px;
  const ly = spec.y + py;
  const rx = spec.x - px;
  const ry = spec.y - py;
  const bx = spec.x - Math.cos(rad) * 2;
  const by = spec.y - Math.sin(rad) * 2;
  const n = (v: number) => v.toFixed(2);
  return `M ${n(lx)} ${n(ly)} Q ${n(tipX)} ${n(tipY)} ${n(rx)} ${n(ry)} Q ${n(bx)} ${n(by)} ${n(lx)} ${n(ly)} Z`;
}

const THREE_QUARTER: DuoDuoGeometry = {
  anchorX: 86,
  body: [
    "M 40 108",
    "C 22 98 18 78 30 62",
    "C 38 52 52 46 66 50",
    "C 62 36 72 20 92 14",
    "C 114 8 138 16 150 34",
    "C 160 50 158 70 144 82",
    "C 132 92 114 98 98 100",
    "C 82 108 58 116 40 108",
    "Z",
  ].join(" "),
  spikes: [
    { x: 44, y: 56, deg: -122 },
    { x: 58, y: 44, deg: -104 },
    { x: 74, y: 32, deg: -90 },
    { x: 92, y: 22, deg: -76 },
    { x: 112, y: 18, deg: -60 },
    { x: 130, y: 24, deg: -44 },
  ],
  wheels: [
    { cx: 34, cy: 104, r: 8, far: true },
    { cx: 112, cy: 104, r: 8, far: true },
    { cx: 54, cy: 112, r: 11 },
    { cx: 128, cy: 112, r: 11 },
  ],
  muzzle: "M 98 60 C 114 52 140 54 150 68 C 156 80 140 96 118 98 C 98 100 86 88 88 74 C 90 64 92 60 98 60 Z",
  muzzleEdge: "M 92 70 C 90 84 102 100 120 98 C 142 96 156 82 150 68",
  window: { x: 40, y: 64, w: 22, h: 26, rx: 8 },
  eyes: [
    { cx: 108, cy: 46, r: 10.5 },
    { cx: 130, cy: 44, r: 10.5 },
  ],
  mouth: { cx: 124, cy: 74, s: 1 },
  nostrils: [
    { cx: 114, cy: 64 },
    { cx: 132, cy: 62 },
  ],
  blush: [
    { cx: 98, cy: 62 },
    { cx: 146, cy: 64 },
  ],
  gloss: { cx: 96, cy: 28, rx: 12, ry: 6 },
  exhaust: { x: 14, y: 84, w: 16, h: 8 },
  puff: { cx: 20, cy: 72 },
  hearts: [
    { x: 150, y: 18, s: 1 },
    { x: 46, y: 16, s: 0.8 },
  ],
  stars: [
    { x: 150, y: 16, s: 1 },
    { x: 42, y: 22, s: 0.75 },
  ],
};

const FRONT: DuoDuoGeometry = {
  anchorX: 84,
  body: [
    "M 84 22",
    "C 114 20 132 40 128 64",
    "C 126 80 120 90 118 98",
    "C 116 114 102 120 84 120",
    "C 66 120 52 114 50 98",
    "C 48 90 42 80 40 64",
    "C 36 40 54 20 84 22",
    "Z",
  ].join(" "),
  spikes: [
    { x: 62, y: 34, deg: -108 },
    { x: 76, y: 24, deg: -96 },
    { x: 92, y: 24, deg: -84 },
    { x: 106, y: 34, deg: -72 },
  ],
  wheels: [
    { cx: 54, cy: 108, r: 7.5, far: true },
    { cx: 114, cy: 108, r: 7.5, far: true },
    { cx: 66, cy: 116, r: 10 },
    { cx: 102, cy: 116, r: 10 },
  ],
  muzzle: "M 62 70 C 72 60 96 60 106 70 C 114 80 108 98 84 102 C 60 98 52 82 62 70 Z",
  muzzleEdge: "M 58 78 C 56 92 68 104 84 102 C 102 100 114 88 108 74",
  eyes: [
    { cx: 66, cy: 56, r: 11 },
    { cx: 102, cy: 56, r: 11 },
  ],
  mouth: { cx: 84, cy: 82, s: 1.05 },
  nostrils: [
    { cx: 74, cy: 72 },
    { cx: 94, cy: 72 },
  ],
  blush: [
    { cx: 52, cy: 74 },
    { cx: 116, cy: 74 },
  ],
  gloss: { cx: 68, cy: 36, rx: 14, ry: 6 },
  exhaust: { x: 22, y: 96, w: 14, h: 7 },
  puff: { cx: 28, cy: 84 },
  hearts: [
    { x: 128, y: 28, s: 1 },
    { x: 36, y: 28, s: 0.8 },
  ],
  stars: [
    { x: 130, y: 24, s: 1 },
    { x: 34, y: 30, s: 0.75 },
  ],
};

const SIDE: DuoDuoGeometry = {
  anchorX: 86,
  body: [
    "M 30 108",
    "C 16 96 16 74 30 60",
    "C 40 50 58 44 76 48",
    "C 72 34 86 18 108 16",
    "C 130 14 150 28 156 48",
    "C 160 64 150 80 134 88",
    "C 118 96 96 102 80 104",
    "C 58 112 42 116 30 108",
    "Z",
  ].join(" "),
  spikes: [
    { x: 40, y: 56, deg: -118 },
    { x: 56, y: 44, deg: -102 },
    { x: 74, y: 34, deg: -90 },
    { x: 94, y: 24, deg: -78 },
    { x: 114, y: 20, deg: -64 },
  ],
  wheels: [
    { cx: 38, cy: 104, r: 7.5, far: true },
    { cx: 108, cy: 104, r: 7.5, far: true },
    { cx: 50, cy: 112, r: 11 },
    { cx: 118, cy: 112, r: 11 },
  ],
  muzzle: "M 124 52 C 136 48 154 54 156 66 C 158 78 144 90 128 88 C 116 86 114 68 124 52 Z",
  muzzleEdge: "M 122 64 C 118 78 126 92 140 90 C 154 88 160 76 156 64",
  window: { x: 44, y: 62, w: 26, h: 24, rx: 8 },
  eyes: [{ cx: 128, cy: 44, r: 10.5 }],
  mouth: { cx: 142, cy: 68, s: 0.92 },
  nostrils: [
    { cx: 146, cy: 58 },
    { cx: 150, cy: 64 },
  ],
  blush: [{ cx: 132, cy: 58 }],
  gloss: { cx: 108, cy: 28, rx: 12, ry: 5 },
  exhaust: { x: 12, y: 86, w: 16, h: 8 },
  puff: { cx: 18, cy: 74 },
  hearts: [
    { x: 152, y: 16, s: 0.9 },
    { x: 96, y: 8, s: 0.7 },
  ],
  stars: [
    { x: 154, y: 14, s: 0.9 },
    { x: 92, y: 10, s: 0.7 },
  ],
};

export const DUODUO_GEOMETRY: Record<DuoDuoView, DuoDuoGeometry> = {
  front: FRONT,
  "three-quarter": THREE_QUARTER,
  side: SIDE,
};
