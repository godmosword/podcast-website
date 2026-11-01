/**
 * 圓角方塊先光柵化進 sprite cache：倒圓角、面的明暗、邊緣高光都在這一張圖裡。
 * 之後每一幀只貼圖，不再重算路徑與漸層。
 */

export type ShapeId = "cube" | "body" | "head" | "slab";

type Rgb = { r: number; g: number; b: number };
type Pt = { x: number; y: number };

export type BlockSprite = {
  canvas: HTMLCanvasElement;
  logicalW: number;
  logicalH: number;
  /** 格子原點 (0,0,0) 在 sprite 裡的位置。 */
  ax: number;
  ay: number;
  tw: number;
};

const SPRITE_TW = 48;
const BITMAP = 2;
const SHAPES: Record<ShapeId, { w: number; d: number; h: number }> = {
  cube: { w: 1, d: 1, h: 1 },
  body: { w: 1, d: 1, h: 0.5 },
  head: { w: 1, d: 1, h: 0.82 },
  slab: { w: 1, d: 1, h: 0.22 },
};

const cache = new Map<string, BlockSprite>();
let builds = 0;

export function spriteBuildCount(): number {
  return builds;
}

export function resetSpriteCache(): void {
  cache.clear();
  builds = 0;
  shadeCache.clear();
  mixCache.clear();
}

const shadeCache = new Map<string, string>();
const mixCache = new Map<string, string>();

export function parseColor(input: string): Rgb {
  const hex = input.trim().match(/^#([\da-f]{6})$/i);
  if (hex?.[1]) {
    const n = Number.parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const rgb = input.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return { r: 200, g: 196, b: 188 };
}

export function shade(color: string, amount: number): string {
  const key = `${color}|${amount}`;
  const hit = shadeCache.get(key);
  if (hit) return hit;
  const c = parseColor(color);
  const f = (n: number) => Math.max(0, Math.min(255, Math.round(n * amount)));
  const out = `rgb(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`;
  shadeCache.set(key, out);
  return out;
}

export function mix(a: string, b: string, t: number): string {
  const key = `${a}|${b}|${t}`;
  const hit = mixCache.get(key);
  if (hit) return hit;
  const ca = parseColor(a);
  const cb = parseColor(b);
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * t);
  const out = `rgb(${lerp(ca.r, cb.r)}, ${lerp(ca.g, cb.g)}, ${lerp(ca.b, cb.b)})`;
  mixCache.set(key, out);
  return out;
}

export function blockSprite(color: string, shape: ShapeId): BlockSprite {
  const key = `${shape}|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const sprite = rasterize(color, shape);
  cache.set(key, sprite);
  builds += 1;
  return sprite;
}

let shadowCached: BlockSprite | null = null;

/** 車底的軟影，同樣只畫一次。 */
export function shadowSprite(): BlockSprite {
  if (shadowCached) return shadowCached;
  const logicalW = 96;
  const logicalH = 48;
  const canvas = document.createElement("canvas");
  canvas.width = logicalW * BITMAP;
  canvas.height = logicalH * BITMAP;
  const ctx = canvas.getContext("2d");
  const sprite: BlockSprite = {
    canvas,
    logicalW,
    logicalH,
    ax: logicalW / 2,
    ay: logicalH / 2,
    tw: SPRITE_TW,
  };
  if (ctx) {
    ctx.setTransform(BITMAP, 0, 0, BITMAP, 0, 0);
    ctx.imageSmoothingEnabled = true;
    const g = ctx.createRadialGradient(sprite.ax, sprite.ay, 4, sprite.ax, sprite.ay, 40);
    g.addColorStop(0, "rgba(58, 36, 16, 0.28)");
    g.addColorStop(1, "rgba(58, 36, 16, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sprite.ax, sprite.ay, 40, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  shadowCached = sprite;
  return sprite;
}

function rasterize(color: string, shape: ShapeId): BlockSprite {
  const spec = SHAPES[shape];
  const tw = SPRITE_TW;
  const th = tw / 2;
  const zh = tw * 1.15;
  const pad = 8;
  const logicalW = Math.ceil((spec.w + spec.d) * tw + pad * 2);
  const logicalH = Math.ceil((spec.w + spec.d) * th + spec.h * zh + pad * 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(logicalW * BITMAP));
  canvas.height = Math.max(1, Math.ceil(logicalH * BITMAP));
  const ox = pad + spec.d * tw;
  const oy = pad + spec.h * zh;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { canvas, logicalW, logicalH, ax: ox, ay: oy, tw };
  }
  ctx.setTransform(BITMAP, 0, 0, BITMAP, 0, 0);
  ctx.imageSmoothingEnabled = true;

  const iso = (x: number, y: number, z: number): Pt => ({
    x: ox + (x - y) * tw,
    y: oy + (x + y) * th - z * zh,
  });
  const w = spec.w;
  const d = spec.d;
  const h = spec.h;
  const top = color;
  const left = shade(color, 0.86);
  const right = shade(color, 0.72);
  const rim = shade(color, 0.6);

  const hex = [
    iso(0, 0, h),
    iso(w, 0, h),
    iso(w, 0, 0),
    iso(w, d, 0),
    iso(0, d, 0),
    iso(0, d, h),
  ];
  traceRounded(ctx, hex, tw * 0.2);
  ctx.fillStyle = rim;
  ctx.fill();

  const face = (pts: Pt[], fill: string) => {
    const inset = insetPoly(pts, 0.07);
    traceRounded(ctx, inset, tw * 0.16);
    ctx.fillStyle = fill;
    ctx.fill();
    return inset;
  };
  face([iso(0, d, 0), iso(w, d, 0), iso(w, d, h), iso(0, d, h)], left);
  face([iso(w, d, 0), iso(w, 0, 0), iso(w, 0, h), iso(w, d, h)], right);
  const topPts = face([iso(0, 0, h), iso(w, 0, h), iso(w, d, h), iso(0, d, h)], top);

  ctx.save();
  traceRounded(ctx, topPts, tw * 0.16);
  ctx.clip();
  const light = topPts.reduce((best, pt) => (pt.y < best.y ? pt : best), topPts[0]!);
  const glow = ctx.createRadialGradient(light.x, light.y, tw * 0.04, light.x, light.y, tw * 0.95);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.82)");
  glow.addColorStop(0.42, "rgba(255, 255, 255, 0.22)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, logicalW, logicalH);
  ctx.beginPath();
  ctx.ellipse(light.x + tw * 0.12, light.y + th * 0.15, tw * 0.14, th * 0.1, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.fill();
  ctx.restore();

  traceRounded(ctx, hex, tw * 0.2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
  ctx.lineWidth = Math.max(1.1, tw * 0.035);
  ctx.lineJoin = "round";
  ctx.stroke();

  return { canvas, logicalW, logicalH, ax: iso(0, 0, 0).x, ay: iso(0, 0, 0).y, tw };
}

function traceRounded(ctx: CanvasRenderingContext2D, pts: Pt[], radius: number) {
  const n = pts.length;
  if (n < 3) return;
  ctx.beginPath();
  for (let i = 0; i < n; i += 1) {
    const prev = pts[(i - 1 + n) % n]!;
    const cur = pts[i]!;
    const next = pts[(i + 1) % n]!;
    const len1 = Math.hypot(prev.x - cur.x, prev.y - cur.y) || 1;
    const len2 = Math.hypot(next.x - cur.x, next.y - cur.y) || 1;
    const r = Math.min(radius, len1 * 0.42, len2 * 0.42);
    const a = { x: cur.x + ((prev.x - cur.x) / len1) * r, y: cur.y + ((prev.y - cur.y) / len1) * r };
    const b = { x: cur.x + ((next.x - cur.x) / len2) * r, y: cur.y + ((next.y - cur.y) / len2) * r };
    if (i === 0) ctx.moveTo(a.x, a.y);
    else ctx.lineTo(a.x, a.y);
    ctx.quadraticCurveTo(cur.x, cur.y, b.x, b.y);
  }
  ctx.closePath();
}

function insetPoly(pts: Pt[], amount: number): Pt[] {
  const c = pts.reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), { x: 0, y: 0 });
  c.x /= pts.length;
  c.y /= pts.length;
  const keep = 1 - amount;
  return pts.map((pt) => ({ x: c.x + (pt.x - c.x) * keep, y: c.y + (pt.y - c.y) * keep }));
}
