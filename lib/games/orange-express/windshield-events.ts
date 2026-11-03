import { RACE_WIN } from "@/lib/games/orange-express/events";
import type { EventResult, SceneId, ScenicEventKind } from "@/lib/games/orange-express/types";
import {
  Z_FAR,
  Z_NEAR,
  poly,
  project,
  quad,
  segment,
  widthAt,
  type View,
} from "@/lib/games/orange-express/windshield-geometry";

/**
 * 前窗裡的沿途事件：小鴨（海邊是螃蟹）過鐵軌、平交道、揮手的小朋友、賽跑的小狗（海邊是海鷗）。
 * 只有幾何色塊；動物都比真的大（小前窗上才看得到），描一圈深色邊（色覺：不只靠顏色），站在灰色道碴上。
 * 減少動態時只有兩個靜態狀態（小鴨在路邊／在對面、柵欄放下／升起、平交道燈常亮），不閃不動。
 */

/** 一站的 0–1 等於幾公尺（跟 windshield.ts 的 STATION_WORLD 同一個數；這裡不引那個檔，免得循環）。 */
const WORLD = 600;

export type EventPaint = {
  kind: ScenicEventKind;
  scene: SceneId;
  /** 事件點在站的 progress（風景段是負的）。 */
  at: number;
  result: EventResult | null;
  /** 秒；揮手、拍翅、平交道燈閃用。減少動態時不用。 */
  time: number;
  /** 車速（0–1）：賽跑時小動物離多遠跟著它（開得比追上門檻快才看得到追近）。沒給當作追上門檻。 */
  speed?: number;
};

/** 小鴨過鐵軌的地方在事件點前方這麼遠：車到事件點時小鴨已經走到對面，車還在幾公尺外。 */
export const DUCK_AHEAD = 8;
/** 三隻小鴨的間距（公尺）。 */
const DUCK_GAP = 3.4;
/** 走完時領頭的那隻在哪（公尺，往右）：最後一隻也離開我們的軌道（鋼軌在 ±0.75）。 */
const DUCK_END = 10;
const DUCK_START = -5;
/** 平交道（道路中心）在事件點前方這麼遠。 */
export const CROSSING_AHEAD = 12;
/** 揮手的小朋友在事件點前方這麼遠。 */
export const WAVE_AHEAD = 10;
/** 賽跑時車速剛好是追上門檻（RACE_WIN）時，小動物跑在鏡頭前這麼遠。 */
export const RACE_AHEAD = 13;
/** 車速比追上門檻每快（慢）1，小動物就近（遠）這麼多公尺；夾在 RACE_CHASE 裡。 */
const RACE_PULL = 20;
const RACE_CHASE = { near: 8, far: 19 } as const;
/** 減少動態、做到了：小動物停在這麼近（剛被超過）。 */
const RACE_NEAR = 6;
/** 賽跑的小動物跑在左邊這條線上（電桿在 -3.4 附近，避開才不會被桿子穿身）。 */
const RACE_X = -5.6;
/** 減少動態時事件那一格的鏡頭：停在事件點前這麼遠，事件的東西在前窗中近處。 */
export const EVENT_VIEW_BEFORE = 6;

/** 比真的大幾倍（每公尺換成幾像素時乘上去）：小前窗上才看得到、認得出。 */
const DUCK_SCALE = 3;
const POST_SCALE = 1.6;
const KID_SCALE = 2;
const RACER_SCALE = 2;

const INK = "rgb(58, 46, 40)";
const DUCK = "rgb(255, 214, 102)";
const DUCK_WING = "rgb(244, 186, 70)";
const BEAK = "rgb(248, 140, 52)";
const CRAB = "rgb(236, 104, 76)";
const CRAB_LIT = "rgb(252, 150, 120)";
const EYE_WHITE = "rgb(255, 252, 244)";
const ROAD = "rgb(120, 112, 108)";
const ROAD_LINE = "rgb(244, 236, 220)";
const POST = "rgb(236, 232, 224)";
const BUCK = "rgb(255, 214, 102)";
const LAMP_ON = "rgb(232, 72, 60)";
const LAMP_OFF = "rgb(120, 72, 70)";
const BAR = "rgb(255, 252, 244)";
const BAR_STRIPE = "rgb(232, 72, 60)";
const SKIN = "rgb(255, 224, 196)";
const HAIR = "rgb(120, 78, 52)";
const SHIRT = "rgb(140, 200, 236)";
const DOG = "rgb(196, 140, 92)";
const PATH = "rgb(170, 160, 148)";
const CAR = "rgb(140, 200, 236)";
const CAR_ROOF = "rgb(236, 244, 250)";
const CAR_LAMP = "rgb(255, 236, 160)";
const CAR_LAMP_OFF = "rgb(214, 206, 190)";
const WHEEL = "rgb(70, 64, 70)";
/** 黏土玩具的亮面（PR-I2）：身體、頭左上一小塊淺色，跟封面小橘的打光同方向。 */
const DOG_LIGHT = "rgb(226, 184, 140)";
/** 小狗的肚子與嘴邊：打破「兩顆同色球」的剪影。 */
const DOG_BELLY = "rgb(236, 204, 160)";
/** 垂耳比身體深一階，伸出頭的輪廓外。 */
const DOG_EAR_DARK = "rgb(122, 74, 44)";
const COLLAR = "rgb(232, 96, 60)";
const TONGUE = "rgb(240, 128, 140)";
const GULL = "rgb(255, 255, 252)";
const GULL_WING = "rgb(176, 186, 196)";
const GROUND_SHADOW = "rgba(58, 46, 40, 0.16)";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function visible(z: number): boolean {
  return z > Z_NEAR + 0.4 && z < Z_FAR;
}

/** 有深色描邊的橢圓（世界座標的中心與半徑，像素在呼叫端換算）。 */
function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, edge: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = edge;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

/** 有深色描邊、可以轉角度的橢圓（垂耳、翅膀、翹尾巴）。 */
function tilted(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  angle: number,
  fill: string,
  edge: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), angle, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = edge;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

/** 沒描邊的橢圓：地上的軟影子、黏土的亮面。 */
function soft(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.6, r), 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * 小鴨過鐵軌的進度 0–1（看車真正的位置 train，公尺；不看時間）。
 * 減少動態只有兩格：車離事件點還遠時在路邊，靠近了就在對面。
 */
export function duckCross(reduced: boolean, train: number, at: number): number {
  const event = at * WORLD;
  if (reduced) return train < event - 25 ? 0 : 1;
  // 車在事件點前 45 公尺開始走、前 15 公尺走完：小鴨離車 53 到 23 公尺時過鐵軌，車到之前軌道就空了。
  return clamp01((train - (event - 45)) / 30);
}

/** 三隻小鴨的橫向位置（領頭的在前）。cross = 1 時都在我們的軌道右邊。 */
export function duckXs(cross: number): number[] {
  const lead = DUCK_START + cross * (DUCK_END - DUCK_START);
  return [0, 1, 2].map((i) => lead - i * DUCK_GAP);
}

function drawDuck(ctx: CanvasRenderingContext2D, view: View, x: number, z: number, crab: boolean, flap: boolean) {
  const base = project(view, x, 0, z);
  const s = widthAt(view, z, DUCK_SCALE, 0.5);
  const edge = Math.max(1, s * 0.08);
  if (crab) {
    const cy = base.y - s * 0.45;
    blob(ctx, base.x - s * 0.72, cy - (flap ? s * 0.35 : 0), s * 0.22, s * 0.2, CRAB_LIT, edge);
    blob(ctx, base.x + s * 0.72, cy - (flap ? s * 0.35 : 0), s * 0.22, s * 0.2, CRAB_LIT, edge);
    blob(ctx, base.x, cy, s * 0.62, s * 0.38, CRAB, edge);
    dot(ctx, base.x - s * 0.2, cy - s * 0.42, s * 0.11, EYE_WHITE);
    dot(ctx, base.x + s * 0.2, cy - s * 0.42, s * 0.11, EYE_WHITE);
    dot(ctx, base.x - s * 0.2, cy - s * 0.42, s * 0.05, INK);
    dot(ctx, base.x + s * 0.2, cy - s * 0.42, s * 0.05, INK);
    return;
  }
  const by = base.y - s * 0.42;
  blob(ctx, base.x, by, s * 0.55, s * 0.36, DUCK, edge);
  if (flap) {
    poly(
      ctx,
      [
        { x: base.x - s * 0.1, y: by - s * 0.1 },
        { x: base.x - s * 0.55, y: by - s * 0.75 },
        { x: base.x - s * 0.45, y: by - s * 0.05 },
      ],
      DUCK_WING,
    );
  }
  const hx = base.x + s * 0.38;
  const hy = by - s * 0.42;
  blob(ctx, hx, hy, s * 0.26, s * 0.26, DUCK, edge);
  poly(
    ctx,
    [
      { x: hx + s * 0.2, y: hy - s * 0.04 },
      { x: hx + s * 0.48, y: hy + s * 0.04 },
      { x: hx + s * 0.2, y: hy + s * 0.12 },
    ],
    BEAK,
  );
  dot(ctx, hx + s * 0.06, hy - s * 0.06, s * 0.05, INK);
}

/** 三隻小鴨（或螃蟹）排隊從左邊走到右邊。做到了：走過去後回頭拍翅（螃蟹舉鉗）。 */
function drawDucks(ctx: CanvasRenderingContext2D, view: View, travel: number, train: number, paint: EventPaint, reduced: boolean) {
  const z = paint.at * WORLD + DUCK_AHEAD - travel;
  if (!visible(z)) return;
  const cross = duckCross(reduced, train, paint.at);
  const crab = paint.scene === "sea";
  const done = paint.result === "done";
  const flap = done && cross >= 1 && (reduced || Math.sin(paint.time * 9) > 0);
  const xs = duckXs(cross);
  // 由遠到近：後面那隻先畫。
  for (let i = 2; i >= 0; i -= 1) drawDuck(ctx, view, xs[i]!, z + i * 0.6, crab, flap);
}

/** 事件的地面（畫在軌道下面）：平交道的路面、小鴨要走的灰色小路（色覺：小鴨站在灰色上，也預告會從這裡過）。 */
export function drawCrossingRoad(ctx: CanvasRenderingContext2D, view: View, travel: number, paint: EventPaint) {
  if (paint.kind === "ducks") {
    const z = paint.at * WORLD + DUCK_AHEAD - travel;
    if (!visible(z + 1.6)) return;
    quad(ctx, view, -16, 14, 0.01, Math.max(Z_NEAR, z - 1.6), z + 1.6, PATH);
    return;
  }
  if (paint.kind !== "crossing") return;
  const z = paint.at * WORLD + CROSSING_AHEAD - travel;
  if (!visible(z + 3)) return;
  const near = Math.max(Z_NEAR, z - 3);
  if (near >= z + 3) return;
  quad(ctx, view, -60, 60, 0.01, near, z + 3, ROAD);
  quad(ctx, view, -60, -4, 0.02, Math.max(Z_NEAR, z - 0.12), z + 0.12, ROAD_LINE);
  quad(ctx, view, 9, 60, 0.02, Math.max(Z_NEAR, z - 0.12), z + 0.12, ROAD_LINE);
}

/** 平交道燈：左右兩顆輪流亮，每秒換一次（≤2Hz）；減少動態常亮。 */
export function crossingLamps(reduced: boolean, time: number): readonly [boolean, boolean] {
  if (reduced) return [true, true];
  const on = Math.floor(time * 2) % 2 === 0;
  return [on, !on];
}

function drawCrossingPost(
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  z: number,
  lamps: readonly [boolean, boolean],
  down: boolean,
  side: -1 | 1,
) {
  const foot = project(view, x, 0, z);
  const top = project(view, x, 3.2 * POST_SCALE, z);
  const s = widthAt(view, z, POST_SCALE, 0.5);
  ctx.fillStyle = POST;
  const pole = Math.max(1.5, s * 0.18);
  ctx.fillRect(foot.x - pole / 2, top.y, pole, foot.y - top.y);
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.strokeRect(foot.x - pole / 2, top.y, pole, foot.y - top.y);
  // 黃黑交叉的警示牌（不寫字）。
  const buckY = top.y + s * 0.2;
  segment(ctx, { x: top.x - s * 0.8, y: buckY - s * 0.45 }, { x: top.x + s * 0.8, y: buckY + s * 0.45 }, INK, s * 0.32);
  segment(ctx, { x: top.x - s * 0.8, y: buckY + s * 0.45 }, { x: top.x + s * 0.8, y: buckY - s * 0.45 }, INK, s * 0.32);
  segment(ctx, { x: top.x - s * 0.75, y: buckY - s * 0.42 }, { x: top.x + s * 0.75, y: buckY + s * 0.42 }, BUCK, s * 0.2);
  segment(ctx, { x: top.x - s * 0.75, y: buckY + s * 0.42 }, { x: top.x + s * 0.75, y: buckY - s * 0.42 }, BUCK, s * 0.2);
  // 兩顆紅燈。
  const lampY = top.y + s * 1.25;
  for (const [i, dx] of [-0.42, 0.42].entries()) {
    blob(ctx, top.x + dx * s, lampY, s * 0.3, s * 0.3, lamps[i] ? LAMP_ON : LAMP_OFF, Math.max(1, s * 0.06));
  }
  // 柵欄：放下時沿著道路橫在軌道旁邊，升起時直直往上。
  // 柵欄往外伸、擋的是道路，不橫過我們的軌道（車照常通過）。
  const pivot = project(view, x, 1.1, z);
  const tip = down ? project(view, x + side * 4.2, 1.1, z) : project(view, x + side * 0.2, 5, z);
  segment(ctx, pivot, tip, INK, Math.max(2, s * 0.24));
  segment(ctx, pivot, tip, BAR, Math.max(1.5, s * 0.16));
  const mid = { x: (pivot.x + tip.x) / 2, y: (pivot.y + tip.y) / 2 };
  segment(ctx, { x: (pivot.x + mid.x) / 2, y: (pivot.y + mid.y) / 2 }, mid, BAR_STRIPE, Math.max(1.5, s * 0.16));
}

/** 柵欄外等車過的小汽車：做到了（按了喇叭）車燈亮著、輕輕彈兩下跟你打招呼；減少動態只亮燈。 */
function drawWaitingCar(ctx: CanvasRenderingContext2D, view: View, z: number, done: boolean, reduced: boolean, time: number) {
  const hop = done && !reduced ? Math.max(0, Math.sin(time * 10)) * 0.25 : 0;
  const s = widthAt(view, z, POST_SCALE, 0.5);
  const base = project(view, -11, hop, z);
  const edge = Math.max(1, s * 0.06);
  ctx.beginPath();
  ctx.ellipse(base.x, base.y - s * 0.75, s * 1.4, s * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = CAR;
  ctx.fill();
  ctx.lineWidth = edge;
  ctx.strokeStyle = INK;
  ctx.stroke();
  blob(ctx, base.x - s * 0.1, base.y - s * 1.25, s * 0.75, s * 0.4, CAR_ROOF, edge);
  blob(ctx, base.x - s * 0.8, base.y - s * 0.2, s * 0.28, s * 0.28, WHEEL, edge);
  blob(ctx, base.x + s * 0.8, base.y - s * 0.2, s * 0.28, s * 0.28, WHEEL, edge);
  // 車頭朝軌道（右邊）：一對車燈像眼睛。
  const lamp = done ? CAR_LAMP : CAR_LAMP_OFF;
  blob(ctx, base.x + s * 1.25, base.y - s * 0.85, s * 0.16, s * 0.16, lamp, edge * 0.8);
  blob(ctx, base.x + s * 1.3, base.y - s * 0.6, s * 0.14, s * 0.14, lamp, edge * 0.8);
}

function drawCrossing(ctx: CanvasRenderingContext2D, view: View, travel: number, train: number, paint: EventPaint, reduced: boolean) {
  const road = paint.at * WORLD + CROSSING_AHEAD - travel;
  if (visible(road)) drawWaitingCar(ctx, view, road, paint.result === "done", reduced, paint.time);
  const z = road - 3.5;
  if (!visible(z)) return;
  // 柵欄在車到事件點之前放下，車過了才升起。
  const down = train < paint.at * WORLD + CROSSING_AHEAD;
  const lamps = down ? crossingLamps(reduced, paint.time) : ([false, false] as const);
  drawCrossingPost(ctx, view, 8.4, z, lamps, down, 1);
  drawCrossingPost(ctx, view, -3.6, z, lamps, down, -1);
}

/** 揮手的小朋友站在左邊路旁。做到了：兩手舉高跳一下。 */
function drawWave(ctx: CanvasRenderingContext2D, view: View, travel: number, paint: EventPaint, reduced: boolean) {
  const z = paint.at * WORLD + WAVE_AHEAD - travel;
  if (!visible(z)) return;
  const done = paint.result === "done";
  const hop = done && !reduced ? Math.abs(Math.sin(paint.time * 7)) * 0.5 : 0;
  const foot = project(view, -3.6, hop, z);
  const s = widthAt(view, z, KID_SCALE, 0.5);
  const edge = Math.max(1, s * 0.07);
  const body = { x: foot.x, y: foot.y - s * 0.9 };
  blob(ctx, body.x, body.y, s * 0.42, s * 0.56, SHIRT, edge);
  const head = { x: body.x, y: body.y - s * 0.95 };
  const swing = reduced ? 0.6 : Math.sin(paint.time * 8) * 0.5;
  const arms = done ? [-1, 1] : [1];
  for (const side of arms) {
    const shoulder = { x: body.x + side * s * 0.35, y: body.y - s * 0.4 };
    const angle = done ? -Math.PI / 2 + side * 0.35 : -Math.PI / 2 + 0.4 + swing;
    const hand = { x: shoulder.x + Math.cos(angle) * s * 0.9 * side, y: shoulder.y + Math.sin(angle) * s * 0.9 };
    segment(ctx, shoulder, hand, INK, s * 0.26);
    segment(ctx, shoulder, hand, SKIN, s * 0.16);
  }
  blob(ctx, head.x, head.y, s * 0.42, s * 0.42, SKIN, edge);
  ctx.beginPath();
  ctx.arc(head.x, head.y - s * 0.08, s * 0.42, Math.PI, 0);
  ctx.fillStyle = HAIR;
  ctx.fill();
  dot(ctx, head.x - s * 0.14, head.y + s * 0.04, s * 0.06, INK);
  dot(ctx, head.x + s * 0.14, head.y + s * 0.04, s * 0.06, INK);
}

/** 終點前小動物離多遠：開得比追上門檻快就近一點、慢就遠一點（推到快看得到在追）。 */
function chaseGap(speed: number): number {
  return Math.min(RACE_CHASE.far, Math.max(RACE_CHASE.near, RACE_AHEAD + (RACE_WIN - speed) * RACE_PULL));
}

/**
 * 賽跑的小動物在鏡頭前多遠：終點前跑在前面，距離跟著車速；過了終點，追上了（終點時夠快）就被小橘超過、往後掉，
 * 沒追上就再往前跑一點、回頭揮手。
 */
export function raceGap(
  reduced: boolean,
  train: number,
  at: number,
  result: EventResult | null,
  speed = RACE_WIN,
): number | null {
  const past = train - at * WORLD;
  // 減少動態：終點前固定距離；做到了就停在很近的旁邊（剛被超過），沒做到停在比較遠的前面。
  if (reduced) {
    if (past <= 0) return RACE_AHEAD;
    return result === "done" ? RACE_NEAR : RACE_AHEAD + 10;
  }
  const gap = chaseGap(speed);
  if (past <= 0) return gap;
  return result === "done" ? gap - past * 0.8 : gap + past * 0.6;
}

function drawRace(ctx: CanvasRenderingContext2D, view: View, train: number, paint: EventPaint, reduced: boolean) {
  const z = raceGap(reduced, train, paint.at, paint.result, paint.speed);
  if (z === null || !visible(z)) return;
  const s = widthAt(view, z, RACER_SCALE, 0.5);
  const edge = Math.max(1, s * 0.07);
  const step = reduced ? 0 : Math.sin(paint.time * 14);
  if (paint.scene === "sea") {
    drawGull(ctx, view, z, s, edge, step, reduced);
    return;
  }
  drawDog(ctx, view, z, s, edge, step);
}

/**
 * 海鷗（PR-I2 黏土化）：圓身體、兩片圓翅膀上下拍，地上一小塊影子（飛著也看得出離地多高）。
 */
function drawGull(ctx: CanvasRenderingContext2D, view: View, z: number, s: number, edge: number, step: number, reduced: boolean) {
  const ground = project(view, RACE_X, 0, z);
  soft(ctx, ground.x, ground.y, s * 0.32, s * 0.08, GROUND_SHADOW);
  const p = project(view, RACE_X, 2.2 + step * 0.15, z);
  const flap = reduced ? 0 : step * 0.35;
  tilted(ctx, p.x - s * 0.55, p.y - s * 0.16, s * 0.6, s * 0.2, -0.35 - flap, GULL_WING, edge);
  tilted(ctx, p.x + s * 0.55, p.y - s * 0.16, s * 0.6, s * 0.2, 0.35 + flap, GULL_WING, edge);
  blob(ctx, p.x, p.y, s * 0.36, s * 0.3, GULL, edge);
  soft(ctx, p.x - s * 0.1, p.y - s * 0.1, s * 0.12, s * 0.07, EYE_WHITE);
}

/**
 * 小狗（PR-I2 黏土化，設計審：純背面兩顆球認不出是狗）：側背 3/4，身體橫的、往前跑，頭轉回來看火車，
 * 露出眼睛、黑鼻頭、粉紅小舌頭；深棕垂耳伸出頭外、C 形尾巴往上翹會搖、四條短腿交替抬、肚子與嘴邊淺色、
 * 紅項圈掛黃鈴鐺。比其他事件角色大 1.3 倍，整隻塗黑時耳朵、尾巴、腳都在剪影外，48px 高也認得出是狗。
 */
function drawDog(ctx: CanvasRenderingContext2D, view: View, z: number, size: number, edge: number, step: number) {
  const s = size * 1.3;
  const foot = project(view, RACE_X, 0, z);
  const bounce = Math.abs(step) * s * 0.06;
  soft(ctx, foot.x, foot.y, s * 0.62, s * 0.12, GROUND_SHADOW);
  const by = foot.y - s * 0.42 - bounce;
  // 尾巴（身體後面先畫）：從屁股往上捲的 C 形，跑的時候左右搖。
  const wag = step * 0.25;
  const root = { x: foot.x - s * 0.42, y: by - s * 0.08 };
  const tip = { x: root.x - s * (0.2 + wag * 0.3), y: root.y - s * 0.42 };
  const bend = { x: root.x - s * 0.34, y: root.y - s * 0.1 };
  for (const [color, width] of [
    [INK, s * 0.2],
    [DOG, s * 0.12],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(root.x, root.y);
    ctx.quadraticCurveTo(bend.x, bend.y, tip.x, tip.y);
    ctx.lineCap = "round";
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  // 四條短腿：後腿一對、前腿一對，對角交替抬。
  for (const [i, dx] of [-0.34, -0.16, 0.16, 0.34].entries()) {
    const lift = Math.max(0, i % 3 === 0 ? step : -step) * s * 0.1;
    blob(ctx, foot.x + dx * s, foot.y - s * 0.1 - lift, s * 0.1, s * 0.13, DOG, edge);
  }
  blob(ctx, foot.x, by, s * 0.5, s * 0.32, DOG, edge);
  soft(ctx, foot.x + s * 0.04, by + s * 0.12, s * 0.32, s * 0.12, DOG_BELLY);
  soft(ctx, foot.x - s * 0.16, by - s * 0.14, s * 0.18, s * 0.08, DOG_LIGHT);
  // 項圈與鈴鐺（脖子在身體前上方）。
  blob(ctx, foot.x + s * 0.3, by - s * 0.24, s * 0.15, s * 0.07, COLLAR, edge * 0.8);
  blob(ctx, foot.x + s * 0.32, by - s * 0.15, s * 0.05, s * 0.05, BUCK, edge * 0.6);
  // 頭轉回來看火車：圓頭、嘴邊淺色、兩眼（有高光）、黑鼻頭、小舌頭；垂耳在頭兩側往外伸。
  const head = { x: foot.x + s * 0.34, y: by - s * 0.5 };
  blob(ctx, head.x, head.y, s * 0.3, s * 0.28, DOG, edge);
  soft(ctx, head.x - s * 0.1, head.y - s * 0.13, s * 0.1, s * 0.06, DOG_LIGHT);
  soft(ctx, head.x, head.y + s * 0.11, s * 0.15, s * 0.1, DOG_BELLY);
  tilted(ctx, head.x - s * 0.3, head.y + s * 0.02, s * 0.1, s * 0.2, 0.4, DOG_EAR_DARK, edge * 0.8);
  tilted(ctx, head.x + s * 0.3, head.y + s * 0.02, s * 0.1, s * 0.2, -0.4, DOG_EAR_DARK, edge * 0.8);
  for (const dx of [-0.11, 0.11]) {
    dot(ctx, head.x + dx * s, head.y - s * 0.03, s * 0.045, INK);
    dot(ctx, head.x + dx * s - s * 0.015, head.y - s * 0.045, s * 0.016, EYE_WHITE);
  }
  soft(ctx, head.x, head.y + s * 0.08, s * 0.06, s * 0.045, INK);
  blob(ctx, head.x, head.y + s * 0.17, s * 0.045, s * 0.05, TONGUE, edge * 0.5);
}

/**
 * 事件的東西（路面以外）：在軌道、速限牌之後、對向列車之前畫。
 * travel 是鏡頭（減少動態時是固定的一格），train 是車真正的位置（公尺）；狀態看 train，遠近看 travel。
 */
export function drawEvent(
  ctx: CanvasRenderingContext2D,
  view: View,
  travel: number,
  train: number,
  paint: EventPaint,
  reduced: boolean,
): void {
  if (paint.kind === "ducks") drawDucks(ctx, view, travel, train, paint, reduced);
  else if (paint.kind === "crossing") drawCrossing(ctx, view, travel, train, paint, reduced);
  else if (paint.kind === "wave") drawWave(ctx, view, travel, paint, reduced);
  else drawRace(ctx, view, train, paint, reduced);
}
