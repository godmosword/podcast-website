import { SEAT_COLOR } from "@/lib/games/orange-express/seats";
import { project, segment, widthAt, Z_NEAR, type Pt, type View } from "@/lib/games/orange-express/windshield-geometry";
import type { PassengerId, SceneId } from "@/lib/games/orange-express/types";

/**
 * 前窗自己會動的小東西（PR-J3）：跟著時鐘（秒）動，不跟著車。時鐘由畫面給：
 * 定格（測試、視覺基準）與減少動態時固定 0，畫面跟以前一樣定住。只畫幾何，不做模糊；同一個畫面新增會動的東西不超過兩樣。
 */

/** 雲每秒往右飄前窗寬的這麼多（很慢：約 2 分鐘飄過一個前窗）。 */
const CLOUD_SPEED = 0.008;
/** 雲飄出右邊後從左邊外面回來：繞一圈是前窗寬的這麼多倍。 */
const CLOUD_LOOP = 1.4;

/** 雲的橫向位置（前窗寬的比例）：base 是時鐘 0 的位置，往右飄、出界後從左邊回來。 */
export function cloudAt(base: number, clock: number): number {
  const x = (base + 0.2 + clock * CLOUD_SPEED) % CLOUD_LOOP;
  return x - 0.2;
}

/**
 * 樹冠左右輕搖（像素）：一陣風吹過、大家一起搖，每棵樹搖的大小不同；最多 2px、也不超過樹冠半徑的 6%。
 * 時鐘 0 時在原位（定格的畫面跟以前一樣）。
 */
export function treeSway(clock: number, seed: number, radius: number): number {
  const amp = Math.min(2, radius * 0.06) * (0.6 + 0.4 * Math.abs(Math.sin(seed * 1.7)));
  return Math.sin(clock * 1.6) * amp;
}

/** 摩天輪每秒轉這麼多（弧度），約 20 秒一圈。 */
export function ferrisSpin(clock: number): number {
  return clock * 0.31;
}

/** 帆船上下晃（像素）：看得出在晃（設計審：原本約 1px 等於沒動）。 */
export function boatBob(clock: number, size: number): number {
  return Math.sin(clock * 1.3) * size * 0.2;
}

/** 一小群鳥：每 BIRD_PERIOD 秒從左飛到右一次，飛過的那段時間才畫（不常出現，免得跟進站、沿途事件搶眼）。 */
const BIRD_PERIOD = 24;
const BIRD_FLY = 6;

export type Flock = { x: number; y: number; flap: number };

/** 這一刻那群鳥在哪（前窗寬、高的比例）；不在天上時是 null。 */
export function flockAt(clock: number): Flock | null {
  const t = ((clock % BIRD_PERIOD) + BIRD_PERIOD) % BIRD_PERIOD;
  if (t > BIRD_FLY) return null;
  const k = t / BIRD_FLY;
  return { x: -0.1 + k * 1.2, y: 0.2 - k * 0.06 + Math.sin(k * Math.PI * 2) * 0.012, flap: Math.sin(clock * 9) };
}

const BIRD_DARK = "rgb(82, 70, 76)";
const BIRD_LIGHT = "rgb(255, 252, 246)";
/** 海鷗是白的，淺藍天上看不清：底下先描一道深灰。 */
const BIRD_EDGE = "rgb(96, 104, 116)";

/** 三隻 V 字小鳥（海邊是白色海鷗）。畫在天上，山的前面、地平線上面。 */
export function drawFlock(ctx: CanvasRenderingContext2D, view: View, scene: SceneId, clock: number): void {
  const flock = flockAt(clock);
  if (!flock) return;
  const span = Math.max(5, view.h * 0.022);
  const color = scene === "sea" ? BIRD_LIGHT : BIRD_DARK;
  const width = Math.max(1.4, span * 0.22);
  for (const [dx, dy] of [
    [0, 0],
    [-1.6, 0.7],
    [-2.9, -0.2],
  ] as const) {
    const x = flock.x * view.w + dx * span * 1.4;
    const y = flock.y * view.h + dy * span;
    const lift = span * (0.35 + flock.flap * 0.25);
    const left = { x: x - span, y: y - lift };
    const right = { x: x + span, y: y - lift };
    if (scene === "sea") {
      segment(ctx, left, { x, y }, BIRD_EDGE, width + 1.6);
      segment(ctx, { x, y }, right, BIRD_EDGE, width + 1.6);
    }
    segment(ctx, left, { x, y }, color, width);
    segment(ctx, { x, y }, right, color, width);
  }
}

/**
 * 等車的朋友站在月台黃線後面、停車柱前面（公尺）。跟停車柱、號誌一樣比真的大（約 1.9 公尺高的玩偶），
 * 進站最後二三十公尺才看得出是人在揮手。
 */
const WAIT_X = -5;
const WAIT_BEFORE_POST = 9;
const WAIT_GAP = 2.2;
/** 太遠的月台小人只有一兩個像素，不畫。 */
const WAIT_FAR = 140;
const SKIN = "rgb(255, 224, 196)";

/** 圓角長方形的路徑。不用 ctx.roundRect：iOS Safari 16.4 才有，舊 iPad 畫到這裡整個前窗會停（工程審）。 */
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number): void {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const OUTLINE = "rgb(58, 46, 40)";

/** 月台小人的衣服：跟座位同色；馬米的橘色只留在耳罩，衣服換棕色（不跟橘色停車柱混在一起，設計審）。 */
const WAIT_BODY: Record<PassengerId, string> = { ...SEAT_COLOR, mami: "rgb(120, 78, 52)" };
const MAMI_MUFF = "rgb(255, 150, 80)";
const BONBON_HAIR = "rgb(140, 96, 64)";
const MAMI_HAIR = "rgb(120, 78, 52)";
const XIAONAN_FACE = "rgb(236, 240, 244)";
const XIAONAN_BLUE = "rgb(90, 160, 210)";
const XIAONAN_GREEN = "rgb(120, 190, 140)";
const SPROUT_FACE = "rgb(176, 226, 196)";
const SPROUT_LEAF = "rgb(96, 168, 84)";
const SHADOW = "rgba(58, 46, 40, 0.22)";

function circle(ctx: CanvasRenderingContext2D, c: Pt, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** 頭照駕駛台座位的頭像（RiderFace）簡化：看得出是同一位朋友。 */
function drawHead(ctx: CanvasRenderingContext2D, id: PassengerId, c: Pt, r: number): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(0.8, r * 0.16);
  if (id === "xiaonan" || id === "dot") {
    const w = r * 2.1;
    const h = id === "dot" ? r * 2.1 : r * 1.6;
    ctx.fillStyle = id === "dot" ? SEAT_COLOR.dot : XIAONAN_FACE;
    ctx.beginPath();
    roundedRect(ctx, c.x - w / 2, c.y - h / 2, w, h, r * 0.55);
    ctx.fill();
    ctx.stroke();
    if (id === "xiaonan") {
      ctx.fillStyle = XIAONAN_BLUE;
      ctx.fillRect(c.x - w / 2 + 1, c.y + h * 0.05, w - 2, h * 0.22);
      ctx.fillStyle = XIAONAN_GREEN;
      ctx.fillRect(c.x - w / 2 + 1, c.y + h * 0.27, w - 2, h * 0.14);
    }
    return;
  }
  if (id === "bonbon") circle(ctx, { x: c.x, y: c.y - r * 0.85 }, r * 0.72, BONBON_HAIR);
  if (id === "mami") {
    circle(ctx, { x: c.x, y: c.y - r * 0.2 }, r * 1.05, MAMI_HAIR);
    circle(ctx, { x: c.x - r * 0.95, y: c.y + r * 0.1 }, r * 0.38, MAMI_MUFF);
    circle(ctx, { x: c.x + r * 0.95, y: c.y + r * 0.1 }, r * 0.38, MAMI_MUFF);
  }
  if (id === "sprout") {
    ctx.fillStyle = SPROUT_LEAF;
    ctx.beginPath();
    ctx.ellipse(c.x + r * 0.35, c.y - r * 1.15, r * 0.42, r * 0.22, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = id === "sprout" ? SPROUT_FACE : SKIN;
  ctx.beginPath();
  ctx.arc(c.x, c.y + (id === "mami" ? r * 0.12 : 0), id === "mami" ? r * 0.82 : r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * 月台上等車的朋友（PR-J3）：進站時就看得到要接的人在月台上揮手。衣服跟駕駛台座位同色、頭照座位頭像畫，
 * 揮的手在朝軌道那一側、畫在頭後面（不穿過臉）；腳下一塊接地影。停好後交給畫面上的月台朋友卡（DOM），這裡不畫。
 */
export function drawWaiting(
  ctx: CanvasRenderingContext2D,
  view: View,
  postWorld: number,
  travel: number,
  platformTop: number,
  riders: readonly PassengerId[],
  clock: number,
): void {
  riders.forEach((id, i) => {
    const z = postWorld - WAIT_BEFORE_POST - i * WAIT_GAP - travel;
    if (z <= Z_NEAR + 1 || z > WAIT_FAR) return;
    const x = WAIT_X - (i % 2) * 0.7;
    const feet = project(view, x, platformTop, z);
    const top = project(view, x, platformTop + 1.3, z);
    const head = project(view, x, platformTop + 1.72, z);
    const body = widthAt(view, z, 0.85, 3);
    const r = widthAt(view, z, 0.36, 2);
    const color = WAIT_BODY[id];
    ctx.fillStyle = SHADOW;
    ctx.beginPath();
    ctx.ellipse(feet.x, feet.y, body * 0.75, Math.max(1, body * 0.18), 0, 0, Math.PI * 2);
    ctx.fill();
    // 揮手：朝軌道那一側（畫面右邊）的肩膀舉高、左右擺；先畫手再畫頭，手不會蓋到臉。
    const shoulder = { x: top.x + body * 0.42, y: top.y + body * 0.25 };
    const a = -1.05 + Math.sin(clock * 5 + i * 1.3) * 0.4;
    const arm = widthAt(view, z, 0.9, 4);
    const hand = { x: shoulder.x + Math.cos(a) * arm, y: shoulder.y + Math.sin(a) * arm };
    segment(ctx, shoulder, hand, color, Math.max(1.2, body * 0.28));
    ctx.fillStyle = color;
    ctx.beginPath();
    roundedRect(ctx, feet.x - body / 2, top.y, body, feet.y - top.y, body * 0.4);
    ctx.fill();
    drawHead(ctx, id, head, r);
  });
}
