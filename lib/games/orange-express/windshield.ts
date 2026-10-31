import { PASS_DURATION } from "@/lib/games/orange-express/reducer";
import { SIGNAL_UNTIL } from "@/lib/games/orange-express/routes";
import type { LandmarkId, Phase, SceneId, SpeedSign, Span } from "@/lib/games/orange-express/types";

/** 一站的 0–1 在前窗裡等於幾公尺的世界。只影響畫面，不影響判定。 */
export const STATION_WORLD = 600;
const Z_NEAR = 2;
const Z_FAR = 220;
const Z_HORIZON = 4000;
const EYE = 1.6;
const SLEEPER_GAP = 0.9;
/** 鋼軌與軌頂亮面的半寬（公尺）。比真的粗一些，小前窗上才看得到。 */
const RAIL_HALF = 0.05;
const SHINE_HALF = 0.018;
const PORTAL_GAP = 50;
const PLATFORM_BEFORE = 70;
const PLATFORM_AFTER = 28;
/**
 * 月台頂比視線只低 0.5 公尺，畫到 Z_NEAR 時近端會停在畫面六成高，下面露出一塊地。
 * 月台單獨畫到更近，頂面才會一路鋪到前窗下緣。
 */
const PLATFORM_NEAR = 0.3;
const POST_AHEAD = 9;
/** 停車柱前後這麼多公尺不畫門形線柱，兩根柱子才不會疊成「雙桿」。 */
const POST_CLEAR = 12;
const OTHER_TRACK = 4.6;
/**
 * 出發號誌立在每站起點前方這麼遠（公尺），在兩條軌道中間。
 * 號誌題（進度 0 到 SIGNAL_UNTIL，也就是 0 到 24 公尺）整段都在前窗裡，題目過了才從旁邊經過。
 */
export const SIGNAL_WORLD = 36;
const SIGNAL_X = 2.3;
/** 燈箱中心離地多高（公尺）。比真的矮：靠近時燈箱才不會跑到前窗頂端、被提示條蓋住。 */
const SIGNAL_HEAD = 2.8;
/** 對向列車：從多遠出現、車身多長。 */
export const PASS_FAR = 220;
export const PASS_LENGTH = 110;
/** 減少動態時對向列車定格在這個時刻：車頭約十公尺外，整列看得清楚。 */
export const REDUCED_PASS = 1.85;
const LAMP_GAP = 14;
/** 路旁樹叢每隔多遠一排；太近不畫（高速時大樹不會一閃一閃）、太遠合成一團。 */
const TREE_GAP = 22;
const TREE_NEAR = 10;
const TREE_FAR = 160;
/** 右邊的樹再遠一點才畫：近的會落在前窗右下，跟指差確認鈕疊在一起。 */
const TREE_RIGHT_NEAR = 18;
/** 站點地標在停車目標之後多遠（公尺）；右邊這一帶留給地標，不畫樹。 */
export const LANDMARK_AHEAD = 40;
const LANDMARK_CLEAR = 30;
/** 號誌、速限牌前後這麼多公尺不生樹。 */
const SIGNAL_CLEAR_BEFORE = 30;
const SIGNAL_CLEAR_AFTER = 20;
const SIGN_CLEAR = 20;
const LANDMARK_LEAD = 150;
const TRUSS_GAP = 9;
const BUILDING_GAP = 26;
const FIELD_GAP = 16;

/** 減少動態時只停在這三格，不連續往前跑。 */
export function windshieldFrame(progress: number, phase: Phase): 0 | 1 | 2 {
  if (phase === "stopped" || phase === "doors-open" || phase === "route-done") return 2;
  if (phase === "in-window" || phase === "reversing" || progress >= 0.45) return 1;
  return 0;
}

function within(span: Span | null | undefined, progress: number): span is Span {
  return span != null && progress >= span.from && progress <= span.to;
}

/**
 * 前窗用的世界位置（公尺）。減少動態時只回幾個固定值：
 * 在隧道或鐵橋上時停在那一段的中間，其餘是遠、近、停好三格。
 */
export function cameraTravel(
  reduced: boolean,
  progress: number,
  phase: Phase,
  target: number,
  spans: { tunnel?: Span | null; bridge?: Span | null } = {},
): number {
  if (!reduced) return progress * STATION_WORLD;
  const frame = windshieldFrame(progress, phase);
  // 剛出發、號誌題還在：停在起點，前窗看得到出發號誌。
  if (frame === 0 && progress < SIGNAL_UNTIL) return 0;
  if (frame === 2) return target * STATION_WORLD;
  if (frame === 1) return (target - 0.12) * STATION_WORLD;
  for (const span of [spans.tunnel, spans.bridge]) {
    if (within(span, progress)) return ((span.from + span.to) / 2) * STATION_WORLD;
  }
  return 0.28 * STATION_WORLD;
}

/** 對向列車車頭離鏡頭幾公尺（相對速度固定，跟我們開多快無關）。 */
export function passingNose(t: number): number {
  return PASS_FAR - (t / PASS_DURATION) * (PASS_FAR + PASS_LENGTH);
}

/** 停車柱在世界裡的位置（公尺）：停車目標再往前一點，停好時柱子剛好在前窗左邊。 */
export function stopPostWorld(target: number): number {
  return target * STATION_WORLD + POST_AHEAD;
}

/** 這座門形線柱要不要畫：離停車柱太近就不畫。 */
export function portalVisible(portalWorld: number, postWorld: number): boolean {
  return Math.abs(portalWorld - postWorld) > POST_CLEAR;
}

/** 速限牌上亮幾格：快 3、中 2、慢 1。牌上不寫字。 */
export function signBars(limit: number): 1 | 2 | 3 {
  if (limit >= 0.7) return 3;
  if (limit >= 0.48) return 2;
  return 1;
}

export type SignCell = { x: number; y: number; w: number; h: number; lit: boolean };

/**
 * 速限牌上永遠三個等高的格子，亮幾格就是多快，沒亮的只描邊。
 * 不畫成一條、兩條：兩條等高的直條看起來就是暫停鍵。
 * 座標以牌心為原點、牌的半徑為 1；前窗畫布與提示小圖共用。
 */
export function signCells(bars: 1 | 2 | 3): SignCell[] {
  const w = 0.2;
  const gap = 0.1;
  const h = 0.62;
  const left = -(3 * w + 2 * gap) / 2;
  return [0, 1, 2].map((i) => ({ x: left + i * (w + gap), y: -h / 2, w, h, lit: i < bars }));
}

type Palette = {
  skyTop: string;
  skyLow: string;
  hillFar: string;
  /** 山頂受光的那一層：上亮下暗兩層，像黏土山丘。 */
  hillFarLit: string;
  hillNear: string;
  hillNearLit: string;
  ground: string;
  groundAlt: string;
  mound: string;
};

/**
 * 顏色對齊封面（2026-10-30）：奶油天空、粉綠的遠山、飽和兩層綠的田。
 * 原本是飽和的藍天、淡綠的地，跟封面像兩部作品。
 */
const PALETTES: Record<SceneId, Palette> = {
  field: {
    skyTop: "rgb(204, 226, 234)",
    skyLow: "rgb(248, 238, 216)",
    hillFar: "rgb(150, 200, 172)",
    hillFarLit: "rgb(184, 222, 196)",
    hillNear: "rgb(118, 184, 132)",
    hillNearLit: "rgb(150, 206, 156)",
    ground: "rgb(146, 202, 116)",
    groundAlt: "rgb(128, 190, 100)",
    mound: "rgb(120, 180, 112)",
  },
  city: {
    skyTop: "rgb(208, 224, 236)",
    skyLow: "rgb(246, 238, 222)",
    hillFar: "rgb(176, 198, 200)",
    hillFarLit: "rgb(204, 220, 220)",
    hillNear: "rgb(150, 188, 162)",
    hillNearLit: "rgb(180, 208, 186)",
    ground: "rgb(214, 206, 184)",
    groundAlt: "rgb(200, 192, 170)",
    mound: "rgb(150, 182, 140)",
  },
  sea: {
    skyTop: "rgb(196, 224, 240)",
    skyLow: "rgb(248, 240, 220)",
    hillFar: "rgb(150, 200, 172)",
    hillFarLit: "rgb(184, 222, 196)",
    hillNear: "rgb(122, 188, 136)",
    hillNearLit: "rgb(154, 208, 160)",
    ground: "rgb(152, 206, 124)",
    groundAlt: "rgb(136, 194, 108)",
    mound: "rgb(124, 182, 116)",
  },
};

/** 黏土雲：亮面、下緣陰影、左上一抹高光。 */
const CLOUD = "rgb(248, 236, 216)";
const CLOUD_SHADE = "rgb(236, 220, 194)";
const CLOUD_LIT = "rgb(255, 255, 252)";
/** 道碴是中暖灰（不是全黑）：乘客卡與指差確認鈕疊在前窗下緣，要靠它襯。 */
const BALLAST = "rgb(166, 156, 144)";
const BALLAST_SHADE = "rgb(136, 126, 114)";
/** 道碴前景的圓石點：亮度只差一點點，像黏土顆粒，不像水泥板。 */
const PEBBLE_LIGHT = "rgb(178, 168, 156)";
const PEBBLE_DARK = "rgb(150, 140, 128)";
/** 道碴與草地交界的沙色路肩（封面的沙地）。 */
const SHOULDER = "rgb(222, 200, 160)";
/** 鋼軌深色、軌頂一條奶油亮線；枕木咖啡色，近緣一道深邊像有厚度。 */
const RAIL = "rgb(92, 78, 68)";
const RAIL_SHINE = "rgb(252, 238, 210)";
const SLEEPER = "rgb(176, 122, 80)";
const SLEEPER_EDGE = "rgb(126, 84, 54)";
/** 門形線柱與架空線：暖咖啡色、圓頭，遠處淡出；不像工程圖。 */
const POLE = "rgb(170, 134, 104)";
/** 圓團樹：兩三層圓、左上高光、下緣暗帶；近處的樹叢最多點一朵小花（封面的細節）。 */
const TREE_DARK = "rgb(82, 150, 72)";
const TREE = "rgb(104, 176, 86)";
const TREE_LIT = "rgb(152, 206, 122)";
const TRUNK = "rgb(140, 98, 64)";
const FLOWER = "rgb(252, 150, 168)";
const FLOWER_EYE = "rgb(255, 222, 110)";
const WIRE = "rgb(150, 120, 96)";
export const PLATFORM_TOP = "rgb(244, 212, 160)";
const PLATFORM_LIP = "rgb(252, 234, 200)";
const PLATFORM_FACE = "rgb(226, 186, 140)";
const PLATFORM_LINE = "rgb(252, 196, 72)";
const POST = "rgb(255, 140, 43)";
const POST_FACE = "rgb(255, 248, 236)";
const WATER = "rgb(112, 184, 226)";
const WATER_FAR = "rgb(150, 206, 238)";
const WAVE = "rgb(236, 248, 255)";
const SAND = "rgb(244, 226, 180)";
const SUN = "rgb(255, 226, 140)";
const SAIL = "rgb(255, 250, 240)";
const TRUSS = "rgb(214, 120, 92)";
const TRUSS_DARK = "rgb(176, 92, 70)";
const TUNNEL_DARK = "rgb(46, 42, 56)";
const TUNNEL_FLOOR = "rgb(74, 68, 80)";
const TUNNEL_RAIL = "rgb(150, 140, 150)";
const TUNNEL_LAMP = "rgb(255, 214, 130)";
const PORTAL_RIM = "rgb(206, 196, 180)";
const SIGN_RING = "rgb(232, 106, 74)";
const SIGN_FACE = "rgb(255, 252, 244)";
const SIGN_UNLIT = "rgb(232, 222, 210)";
const SIGNAL_BOX = "rgb(52, 50, 62)";
const SIGNAL_GO = "rgb(96, 214, 120)";
const SIGNAL_GLOW = "rgb(196, 246, 196)";
const SIGNAL_OFF = "rgb(120, 72, 70)";
const SIGNAL_RIM = "rgb(236, 232, 224)";
const INK = "rgb(58, 46, 40)";
const TRAIN_BODY = "rgb(252, 248, 238)";
const TRAIN_ROOF = "rgb(232, 230, 224)";
/** 淡紫腰帶：白車身配天藍腰帶太像真實車種，換成沒有真實列車在用的顏色。 */
const TRAIN_STRIPE = "rgb(176, 150, 220)";
const TRAIN_WINDOW = "rgb(70, 96, 120)";
const TRAIN_SKIRT = "rgb(160, 164, 170)";
const TRAIN_LAMP = "rgb(255, 236, 160)";
const BUILDINGS = [
  "rgb(246, 214, 190)",
  "rgb(206, 222, 240)",
  "rgb(240, 232, 200)",
  "rgb(214, 236, 214)",
  "rgb(236, 210, 222)",
] as const;
const BUILDING_WINDOW = "rgb(255, 250, 236)";

export type WindshieldPaint = {
  progress: number;
  phase: Phase;
  reduced: boolean;
  /** 這一站停車目標（0–1），月台與停車柱以它為準。 */
  target: number;
  scene?: SceneId;
  tunnel?: Span | null;
  bridge?: Span | null;
  signs?: readonly SpeedSign[];
  /** 對向列車擦身的秒數；null 表示沒有。 */
  passing?: number | null;
  /** 這一站的地標（停車目標之後、月台另一側）。 */
  landmark?: LandmarkId | null;
  /** 直式矮手機（CSS 的 portrait 且高 ≤600）：地標改放停車目標條右邊那一欄。 */
  compact?: boolean;
};

export type View = { w: number; h: number; vx: number; hy: number; f: number };

/** 前窗的投影：消失點在中間、地平線在四成二高。 */
export function viewFor(width: number, height: number): View {
  return { w: width, h: height, vx: width * 0.5, hy: height * 0.42, f: (height * 0.58 * Z_NEAR) / EYE };
}

type Pt = { x: number; y: number };

function project(view: View, x: number, y: number, z: number): Pt {
  const s = view.f / z;
  return { x: view.vx + x * s, y: view.hy + (EYE - y) * s };
}

function poly(ctx: CanvasRenderingContext2D, pts: readonly Pt[], color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
}

/** 水平面（地面、月台頂、車頂）。 */
function quad(
  ctx: CanvasRenderingContext2D,
  view: View,
  x0: number,
  x1: number,
  y: number,
  z0: number,
  z1: number,
  color: string,
): void {
  poly(
    ctx,
    [project(view, x0, y, z0), project(view, x1, y, z0), project(view, x1, y, z1), project(view, x0, y, z1)],
    color,
  );
}

/** 跟軌道平行的直牆（建築側面、車身側面）。 */
function wall(
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  color: string,
): void {
  poly(
    ctx,
    [project(view, x, y0, z0), project(view, x, y1, z0), project(view, x, y1, z1), project(view, x, y0, z1)],
    color,
  );
}

/** 面向鏡頭的直牆（建築正面、車頭）。 */
function face(
  ctx: CanvasRenderingContext2D,
  view: View,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z: number,
  color: string,
): void {
  const a = project(view, x0, y1, z);
  const b = project(view, x1, y0, z);
  ctx.fillStyle = color;
  ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
}

function line(
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  y: number,
  z0: number,
  z1: number,
  color: string,
  width: number,
): void {
  const a = project(view, x, y, z0);
  const b = project(view, x, y, z1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function segment(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function widthAt(view: View, z: number, meters: number, min = 1): number {
  return Math.max(min, (view.f / z) * meters);
}

/** 世界裡每隔 gap 公尺重複的東西，回傳這一幀看得到的 z（由遠到近）。 */
function repeats(travel: number, gap: number, near: number, far: number): number[] {
  const offset = ((travel % gap) + gap) % gap;
  const out: number[] = [];
  for (let z = gap - offset; z < far; z += gap) {
    if (z > near) out.push(z);
  }
  return out.reverse();
}

/** 用世界位置挑一個穩定的小變化（建築高度、顏色）。 */
function hashAt(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function drawSky(ctx: CanvasRenderingContext2D, view: View, palette: Palette, scene: SceneId): void {
  const { w, h, hy } = view;
  const sky = ctx.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(1, palette.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, hy + 1);

  if (scene === "sea") {
    ctx.fillStyle = SUN;
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.13, h * 0.055, 0, Math.PI * 2);
    ctx.fill();
  }

  // 最多兩朵（設計文件第 9 節）。
  drawCloud(ctx, w * 0.2, h * 0.13, Math.min(w * 0.05, h * 0.06));
  drawCloud(ctx, w * 0.64, h * 0.08, Math.min(w * 0.04, h * 0.048));
}

/** 黏土雲：三四顆圓疊成，下緣一道淡陰影，左上一抹高光。s 是一顆圓的半徑（像素）。 */
function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = CLOUD_SHADE;
  ctx.beginPath();
  ctx.ellipse(x + s * 0.1, y + s * 0.5, s * 2.2, s * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CLOUD;
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.25, s * 2.1, s * 0.62, 0, 0, Math.PI * 2);
  for (const [dx, dy, r] of [
    [-1.15, 0.05, 0.72],
    [-0.35, -0.35, 0.95],
    [0.6, -0.18, 0.85],
    [1.35, 0.12, 0.6],
  ] as const) {
    ctx.moveTo(x + dx * s + r * s, y + dy * s);
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.fillStyle = CLOUD_LIT;
  ctx.beginPath();
  ctx.ellipse(x - s * 0.55, y - s * 0.75, s * 0.42, s * 0.2, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

/** 圓頂山丘：[中心（前窗寬的比例）, 半寬（比例）, 高（前窗高的比例）]。 */
type Dome = readonly [number, number, number];

/** 兩層圓頂雙綠山丘（封面火車以外第二大的辨識元素）：後層淡、前層綠，海邊只在左半邊，城市壓低。 */
const HILL_DOMES: Record<SceneId, { back: readonly Dome[]; front: readonly Dome[] }> = {
  field: {
    back: [
      [0.08, 0.16, 0.1],
      [0.32, 0.2, 0.12],
      [0.56, 0.18, 0.09],
      [0.8, 0.2, 0.115],
      [1.02, 0.14, 0.08],
    ],
    front: [
      [0.02, 0.15, 0.06],
      [0.24, 0.12, 0.045],
      [0.88, 0.17, 0.065],
    ],
  },
  city: {
    back: [
      [0.15, 0.2, 0.06],
      [0.5, 0.25, 0.07],
      [0.86, 0.2, 0.06],
    ],
    front: [],
  },
  sea: {
    back: [
      [0.05, 0.15, 0.1],
      [0.27, 0.16, 0.08],
    ],
    front: [[0.12, 0.11, 0.05]],
  },
};

function drawDomes(
  ctx: CanvasRenderingContext2D,
  view: View,
  domes: readonly Dome[],
  lit: string,
  base: string,
): void {
  if (domes.length === 0) return;
  const { w, h, hy } = view;
  const top = Math.max(...domes.map(([, , dh]) => dh));
  const fill = ctx.createLinearGradient(0, hy - h * top, 0, hy);
  fill.addColorStop(0, lit);
  fill.addColorStop(1, base);
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (const [cx, rx, dh] of domes) {
    ctx.moveTo(w * (cx - rx), hy + 1);
    ctx.ellipse(w * cx, hy + 1, w * rx, h * dh, 0, Math.PI, Math.PI * 2);
  }
  ctx.fill();
}

function drawHills(ctx: CanvasRenderingContext2D, view: View, palette: Palette, scene: SceneId): void {
  const domes = HILL_DOMES[scene];
  drawDomes(ctx, view, domes.back, palette.hillFarLit, palette.hillFar);
  drawDomes(ctx, view, domes.front, palette.hillNearLit, palette.hillNear);
}

/** 遠方的城市剪影：圓角色塊與亮窗，沒有招牌、沒有字。 */
function drawSkyline(ctx: CanvasRenderingContext2D, view: View): void {
  const { w, h, hy } = view;
  let x = w * 0.02;
  let i = 0;
  while (x < w) {
    const bw = w * (0.04 + hashAt(i + 1) * 0.05);
    const bh = h * (0.05 + hashAt(i + 7) * 0.12);
    ctx.fillStyle = BUILDINGS[i % BUILDINGS.length]!;
    ctx.fillRect(x, hy - bh, bw - 2, bh + 1);
    ctx.fillStyle = BUILDING_WINDOW;
    const cell = Math.max(3, bw / 5);
    for (let wy = hy - bh + cell * 0.6; wy < hy - cell; wy += cell * 1.4) {
      for (let wx = x + cell * 0.6; wx < x + bw - cell; wx += cell * 1.3) {
        ctx.fillRect(wx, wy, cell * 0.55, cell * 0.6);
      }
    }
    x += bw + w * 0.01;
    i += 1;
  }
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  view: View,
  palette: Palette,
  scene: SceneId,
  travel: number,
): void {
  const { w, h, hy } = view;
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, hy, w, h - hy);

  if (scene === "field") {
    for (const z of repeats(travel, FIELD_GAP * 2, Z_NEAR, Z_FAR)) {
      quad(ctx, view, -80, -5.5, 0, z, z + FIELD_GAP, palette.groundAlt);
      quad(ctx, view, 10, 80, 0, z, z + FIELD_GAP, palette.groundAlt);
    }
  }

  if (scene === "sea") {
    quad(ctx, view, 8, 3000, 0, Z_NEAR, Z_HORIZON, WATER_FAR);
    quad(ctx, view, 8, 3000, 0, Z_NEAR, 90, WATER);
    quad(ctx, view, 6.6, 9, 0.01, Z_NEAR, Z_HORIZON, SAND);
    for (const z of repeats(travel, 12, Z_NEAR, 120)) {
      const a = project(view, 12 + hashAt(z + travel) * 30, 0.02, z);
      const len = widthAt(view, z, 2.4, 3);
      segment(ctx, a, { x: a.x + len, y: a.y }, WAVE, widthAt(view, z, 0.12, 1));
    }
    const boat = project(view, 160, 0, 900);
    const size = Math.max(6, h * 0.04);
    poly(
      ctx,
      [
        { x: boat.x, y: boat.y - size * 1.6 },
        { x: boat.x + size, y: boat.y - size * 0.2 },
        { x: boat.x, y: boat.y - size * 0.2 },
      ],
      SAIL,
    );
    poly(
      ctx,
      [
        { x: boat.x - size * 0.8, y: boat.y - size * 0.2 },
        { x: boat.x + size * 1.2, y: boat.y - size * 0.2 },
        { x: boat.x + size * 0.8, y: boat.y + size * 0.15 },
        { x: boat.x - size * 0.5, y: boat.y + size * 0.15 },
      ],
      SIGN_RING,
    );
  }
}

/** 城市：軌道兩旁一排排小房子，只畫正面和朝軌道的側面。 */
function drawBuildings(ctx: CanvasRenderingContext2D, view: View, travel: number): void {
  for (const z of repeats(travel, BUILDING_GAP, Z_NEAR + 1, 180)) {
    const id = Math.round((z + travel) / BUILDING_GAP);
    for (const side of [-1, 1] as const) {
      const seed = id * 2 + (side > 0 ? 1 : 0);
      const height = 6 + hashAt(seed) * 12;
      const depth = 14;
      const inner = side < 0 ? -10 : 14.6;
      const outer = side < 0 ? -26 : 30.6;
      const color = BUILDINGS[seed % BUILDINGS.length]!;
      wall(ctx, view, inner, 0, height, z, z + depth, color);
      face(ctx, view, Math.min(inner, outer), Math.max(inner, outer), 0, height, z, color);
      const cols = 3;
      const span = Math.abs(outer - inner);
      for (let row = 1; row * 3 < height - 1; row += 1) {
        for (let c = 0; c < cols; c += 1) {
          const wx = Math.min(inner, outer) + (span / cols) * (c + 0.3);
          face(ctx, view, wx, wx + span / cols / 2.2, row * 3, row * 3 + 1.3, z - 0.01, BUILDING_WINDOW);
        }
      }
    }
  }
}

function drawWater(ctx: CanvasRenderingContext2D, view: View, z0: number, z1: number): void {
  const a = Math.max(Z_NEAR, z0);
  const b = Math.min(Z_FAR, z1);
  if (b <= a) return;
  quad(ctx, view, -200, 200, -0.02, a, b, WATER);
  quad(ctx, view, -200, 200, -0.01, a, Math.min(b, a + 1.5), WAVE);
}

function drawTrack(
  ctx: CanvasRenderingContext2D,
  view: View,
  center: number,
  travel: number,
  dim = false,
  zFar = Z_FAR,
): void {
  // 半寬 2.35：兩條軌道（中心距 4.6）的路肩接在一起，中間不會露出一條細細的綠線。
  if (!dim) quad(ctx, view, center - 2.35, center + 2.35, 0, Z_NEAR, zFar, SHOULDER);
  quad(ctx, view, center - 1.7, center + 1.7, 0, Z_NEAR, zFar, dim ? TUNNEL_FLOOR : BALLAST);
  if (!dim) drawPebbles(ctx, view, center, travel);
  const offset = ((travel % SLEEPER_GAP) + SLEEPER_GAP) % SLEEPER_GAP;
  for (let z = Z_NEAR + SLEEPER_GAP - offset; z < Math.min(70, zFar); z += SLEEPER_GAP) {
    quad(ctx, view, center - 1.25, center + 1.25, 0, z, z + 0.24, dim ? TUNNEL_DARK : SLEEPER);
    if (!dim) quad(ctx, view, center - 1.25, center + 1.25, 0.001, z, z + 0.06, SLEEPER_EDGE);
  }
  // 鋼軌是有寬度的面，近粗遠細；再描一條 1px 的線，遠處縮成次像素時仍連得起來。
  // 以前是固定粗細的線，寬畫面上會變成兩條一樣粗的槓一路伸到消失點。
  for (const side of [-0.75, 0.75]) {
    const x = center + side;
    quad(ctx, view, x - RAIL_HALF, x + RAIL_HALF, 0.05, Z_NEAR, zFar, dim ? TUNNEL_RAIL : RAIL);
    line(ctx, view, x, 0.05, Z_NEAR, zFar, dim ? TUNNEL_RAIL : RAIL, 1);
    if (!dim) quad(ctx, view, x - SHINE_HALF, x + SHINE_HALF, 0.08, Z_NEAR, zFar, RAIL_SHINE);
  }
}

/** 門形線柱近處實、遠處淡：90 公尺以外漸淡，最淡留三成五。 */
export function poleAlpha(z: number): number {
  if (z <= 90) return 1;
  return Math.max(0.35, 1 - (z - 90) / 160);
}

export type TreeSpot = {
  side: -1 | 1;
  /** 樹在這一站的世界位置（公尺）。 */
  world: number;
  /** 離鏡頭多遠（公尺）。 */
  z: number;
  targetWorld: number;
  scene: SceneId;
  tunnel: Span | null;
  bridge: Span | null;
  /** 直式矮手機：地標放右邊，地標那一帶右邊不生樹。 */
  compact?: boolean;
  /** 路旁速限牌（立在左邊）：牌子前後左邊不生樹。 */
  signs?: readonly SpeedSign[];
};

/**
 * 路旁樹叢的禁區，讓停車柱、月台、指差確認鈕、地標仍是最搶眼的：
 * 太近或太遠不畫；城市有房子不畫；海邊右邊是海；隧道與鐵橋那段不畫；
 * 月台那段左邊不畫；右邊太近（前窗右下的指差確認鈕）與地標那帶不畫。
 */
export function treeVisible(spot: TreeSpot): boolean {
  const { side, world, z, targetWorld, scene, tunnel, bridge } = spot;
  if (z < TREE_NEAR || z > TREE_FAR) return false;
  // 出發號誌前後兩側淨空：綠燈落在綠樹冠前面最容易看不出來。
  if (world >= SIGNAL_WORLD - SIGNAL_CLEAR_BEFORE && world <= SIGNAL_WORLD + SIGNAL_CLEAR_AFTER) return false;
  if (side < 0 && (spot.signs ?? []).some((sign) => Math.abs(world - sign.at * STATION_WORLD) <= SIGN_CLEAR)) return false;
  if (scene === "city") return false;
  if (scene === "sea" && side > 0) return false;
  for (const span of [tunnel, bridge]) {
    if (span && world >= span.from * STATION_WORLD - 8 && world <= span.to * STATION_WORLD + 8) return false;
  }
  if (side < 0) {
    if (world >= targetWorld - PLATFORM_BEFORE - 10 && world <= targetWorld + PLATFORM_AFTER + 10) return false;
    if (side === landmarkSide(scene, spot.compact) && inLandmarkBand(world, targetWorld)) return false;
    return true;
  }
  if (side === landmarkSide(scene, spot.compact) && inLandmarkBand(world, targetWorld)) return false;
  return z >= TREE_RIGHT_NEAR;
}

/** 地標那一側從站前（停車目標前 150 公尺）到地標後面都不生樹：進站時遠遠就看得到「快到了」。 */
function inLandmarkBand(world: number, targetWorld: number): boolean {
  return world >= targetWorld - LANDMARK_LEAD && world <= targetWorld + LANDMARK_AHEAD + LANDMARK_CLEAR;
}

/** 圓團樹：樹幹、深色底圓、兩顆側圓、左上亮圓；遠處只畫一顆圓。 */
function drawTree(ctx: CanvasRenderingContext2D, view: View, x: number, z: number, seed: number): void {
  const size = 1.6 + hashAt(seed + 3) * 0.9;
  const r = widthAt(view, z, size, 1.5);
  const foot = project(view, x, 0, z);
  const c = project(view, x, size * 1.25, z);
  if (z > 90) {
    ctx.fillStyle = TREE_DARK;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = TRUNK;
  ctx.fillRect(foot.x - r * 0.16, c.y, r * 0.32, foot.y - c.y);
  ctx.fillStyle = TREE_DARK;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + r * 0.15, r * 1.05, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TREE;
  ctx.beginPath();
  ctx.arc(c.x - r * 0.42, c.y + r * 0.05, r * 0.62, 0, Math.PI * 2);
  ctx.moveTo(c.x + r * 0.96, c.y);
  ctx.arc(c.x + r * 0.38, c.y, r * 0.58, 0, Math.PI * 2);
  ctx.moveTo(c.x + r * 0.7, c.y - r * 0.35);
  ctx.arc(c.x, c.y - r * 0.35, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TREE_LIT;
  ctx.beginPath();
  ctx.ellipse(c.x - r * 0.3, c.y - r * 0.55, r * 0.34, r * 0.22, -0.4, 0, Math.PI * 2);
  ctx.fill();
  if (z < 45 && hashAt(seed + 11) > 0.5) {
    const fr = Math.max(1.5, r * 0.13);
    const fx = c.x + r * 0.35;
    const fy = c.y + r * 0.25;
    ctx.fillStyle = FLOWER;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = FLOWER_EYE;
    ctx.beginPath();
    ctx.arc(fx, fy, fr * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTrees(
  ctx: CanvasRenderingContext2D,
  view: View,
  travel: number,
  paint: Pick<WindshieldPaint, "scene" | "tunnel" | "bridge" | "target" | "compact" | "signs">,
  nearerThan = TREE_FAR,
): void {
  const scene = paint.scene ?? "field";
  const targetWorld = paint.target * STATION_WORLD;
  for (const z of repeats(travel, TREE_GAP, TREE_NEAR, Math.min(TREE_FAR, nearerThan))) {
    const world = travel + z;
    const row = Math.round(world / TREE_GAP);
    for (const side of [-1, 1] as const) {
      const seed = row * 2 + (side > 0 ? 1 : 0);
      const spot = {
        side,
        world,
        z,
        targetWorld,
        scene,
        tunnel: paint.tunnel ?? null,
        bridge: paint.bridge ?? null,
        compact: paint.compact,
        signs: paint.signs,
      };
      if (!treeVisible(spot)) {
        continue;
      }
      // 寬畫面（桌機）同樣的公尺離中間比較近，樹往外推，不擠在軌道兩旁的中距離。
      const spread = view.w / view.h > 1.8 ? 1.7 : 1;
      const x = side < 0 ? -(8 + hashAt(seed) * 6) * spread : (11 + hashAt(seed) * 6) * spread;
      drawTree(ctx, view, x, z, seed);
    }
  }
}

/**
 * 地標在哪一邊：回家站右邊是海，小房子放左邊陸地上；其他站放月台另一側（右邊）。
 * 直式矮手機（compact）一律放右邊那一欄：見 landmarkX。
 */
export function landmarkSide(scene: SceneId, compact = false): -1 | 1 {
  if (compact) return 1;
  return scene === "sea" ? -1 : 1;
}

/** 直式矮手機停好時，地標中心落在前窗這個位置（停車目標條右緣在 74%，右邊那一欄是空的）。 */
const COMPACT_LANDMARK_AT = 0.87;

/** 直式矮手機上小房子放大：原本只有摩天輪、橘子樹一半高，最後一站卻最不起眼。 */
function landmarkScale(id: LandmarkId, compact: boolean): number {
  return compact && id === "house" ? 1.5 : 1;
}

/**
 * 地標離軌道多遠（公尺）。回家站放更外面，不跟停車柱疊在一起。
 * 直式矮手機（高 ≤600，CSS 同一個斷點）前窗只剩一兩百 px，停車目標條佔掉上方大半寬，
 * 站在地平線上的地標整個在條子底下；改放進條子右邊讓出來的那一欄（回家站是海中的小草坡）。
 */
function landmarkX(view: View, scene: SceneId, compact: boolean): number {
  if (compact) return (view.w * COMPACT_LANDMARK_AT - view.vx) / (view.f / LANDMARK_AHEAD);
  return scene === "sea" ? -24 : 17;
}

/** 地標的寬與高（公尺）。停好時約前窗六分之一寬，夾在上方提示條與右下指差確認鈕之間。 */
const LANDMARK_SIZE: Record<LandmarkId, { w: number; h: number }> = {
  ferris: { w: 11.5, h: 12.5 },
  "orange-tree": { w: 13, h: 13.5 },
  house: { w: 8.5, h: 9 },
};

export type ScreenBox = { left: number; top: number; right: number; bottom: number };

/** 地標在前窗上佔的框（像素）；開過了或太遠就是 null。 */
export function landmarkBox(
  view: View,
  travel: number,
  targetWorld: number,
  scene: SceneId,
  id: LandmarkId,
  compact = false,
): ScreenBox | null {
  const z = targetWorld + LANDMARK_AHEAD - travel;
  if (z <= Z_NEAR + 2 || z > 900) return null;
  const s = view.f / z;
  const foot = project(view, landmarkX(view, scene, compact), 0, z);
  const k = landmarkScale(id, compact);
  const { w, h } = LANDMARK_SIZE[id];
  return { left: foot.x - (w / 2) * s * k, right: foot.x + (w / 2) * s * k, top: foot.y - h * s * k, bottom: foot.y };
}

/** 停車柱（含圓牌）在前窗上佔的框，地標不能疊上去。 */
export function postScreenBox(view: View, travel: number, target: number): ScreenBox {
  const z = stopPostWorld(target) - travel;
  const scale = view.f / z;
  const foot = project(view, -2.3, 1.1, z);
  const head = project(view, -2.3, 3.2, z);
  const radius = Math.max(5, scale * 0.6);
  return { left: head.x - radius, right: head.x + radius, top: head.y - radius, bottom: foot.y };
}

const FERRIS_RIM = "rgb(236, 128, 104)";
const FERRIS_LEG = "rgb(176, 150, 214)";
const FERRIS_SPOKE = "rgb(255, 244, 226)";
const FERRIS_HUB = "rgb(176, 140, 220)";
const STAR = "rgb(255, 214, 90)";
const GONDOLAS = [
  "rgb(247, 168, 196)",
  "rgb(255, 214, 102)",
  "rgb(150, 214, 180)",
  "rgb(140, 200, 236)",
  "rgb(196, 170, 230)",
  "rgb(255, 170, 100)",
] as const;
const ORANGE = "rgb(255, 150, 48)";
const ORANGE_LIT = "rgb(255, 214, 150)";
const MOUND = "rgb(118, 184, 108)";
const MOUND_LIT = "rgb(156, 208, 136)";
const HOUSE_WALL = "rgb(255, 244, 224)";
const HOUSE_ROOF = "rgb(188, 70, 58)";
const HOUSE_ROOF_DARK = "rgb(184, 70, 56)";
const HOUSE_WINDOW = "rgb(255, 214, 102)";
const HOUSE_DOOR = "rgb(150, 100, 70)";

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

/** 草坡：地標站在上面，像封面裡的黏土小丘。 */
function mound(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = MOUND;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = MOUND_LIT;
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.25, y - ry * 0.55, rx * 0.4, ry * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 摩天輪：照封面簡化——圓圈、六根輻條、六個彩色車廂、星星輪軸。 */
function drawFerris(ctx: CanvasRenderingContext2D, x: number, ground: number, s: number): void {
  const R = 5.5 * s;
  const cy = ground - 7 * s;
  const leg = Math.max(1, 0.45 * s);
  segment(ctx, { x: x - 4 * s, y: ground }, { x, y: cy }, FERRIS_LEG, leg);
  segment(ctx, { x: x + 4 * s, y: ground }, { x, y: cy }, FERRIS_LEG, leg);
  for (let i = 0; i < 6; i += 1) {
    const a = (i * Math.PI) / 3;
    segment(ctx, { x, y: cy }, { x: x + Math.cos(a) * R, y: cy + Math.sin(a) * R }, FERRIS_SPOKE, Math.max(0.8, 0.25 * s));
  }
  ctx.strokeStyle = FERRIS_RIM;
  ctx.lineWidth = Math.max(2, 0.8 * s);
  ctx.beginPath();
  ctx.arc(x, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    ctx.fillStyle = GONDOLAS[i]!;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * R, cy + Math.sin(a) * R, Math.max(1.5, 1.35 * s), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = FERRIS_HUB;
  ctx.beginPath();
  ctx.arc(x, cy, Math.max(1.2, 1.25 * s), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = STAR;
  star(ctx, x, cy, Math.max(1, 0.95 * s));
}

/** 橘子坡：小坡上一棵掛滿橘子的大樹（路旁樹的兩三倍），橘子是大顆圓點。 */
function drawOrangeTree(ctx: CanvasRenderingContext2D, x: number, ground: number, s: number): void {
  mound(ctx, x, ground, 6.5 * s, 2.8 * s);
  const top = ground - 2.4 * s;
  const c = { x, y: top - 5.4 * s };
  const r = 4.8 * s;
  ctx.fillStyle = TRUNK;
  ctx.fillRect(x - 0.45 * s, c.y, 0.9 * s, top - c.y);
  ctx.fillStyle = TREE_DARK;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + r * 0.15, r * 1.05, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TREE;
  ctx.beginPath();
  ctx.arc(c.x - r * 0.42, c.y + r * 0.05, r * 0.62, 0, Math.PI * 2);
  ctx.moveTo(c.x + r * 0.96, c.y);
  ctx.arc(c.x + r * 0.38, c.y, r * 0.58, 0, Math.PI * 2);
  ctx.moveTo(c.x + r * 0.7, c.y - r * 0.35);
  ctx.arc(c.x, c.y - r * 0.35, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TREE_LIT;
  ctx.beginPath();
  ctx.ellipse(c.x - r * 0.3, c.y - r * 0.55, r * 0.34, r * 0.22, -0.4, 0, Math.PI * 2);
  ctx.fill();
  const fruit = Math.max(2.5, 0.85 * s);
  for (const [dx, dy] of [
    [-0.5, -0.15],
    [0.15, -0.55],
    [0.62, -0.02],
    [-0.15, 0.38],
    [0.45, 0.48],
    [-0.72, 0.42],
  ] as const) {
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(c.x + dx * r, c.y + dy * r, fruit, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ORANGE_LIT;
    ctx.beginPath();
    ctx.arc(c.x + dx * r - fruit * 0.35, c.y + dy * r - fruit * 0.35, fruit * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 回家：草坡上的紅屋頂小房子，有煙囪和黃色亮窗。 */
function drawHouse(ctx: CanvasRenderingContext2D, x: number, ground: number, s: number, moundHeight = 1.4): void {
  mound(ctx, x, ground, 4.6 * s, moundHeight * s);
  const base = ground - 0.9 * s;
  const top = base - 4 * s;
  ctx.fillStyle = HOUSE_ROOF_DARK;
  ctx.fillRect(x + 1.5 * s, top - 2.8 * s, 0.9 * s, 1.8 * s);
  ctx.fillStyle = HOUSE_WALL;
  ctx.fillRect(x - 3 * s, top, 6 * s, base - top);
  poly(
    ctx,
    [
      { x: x - 3.8 * s, y: top + 0.2 * s },
      { x, y: top - 3 * s },
      { x: x + 3.8 * s, y: top + 0.2 * s },
    ],
    HOUSE_ROOF,
  );
  ctx.fillStyle = HOUSE_WINDOW;
  ctx.fillRect(x - 2.3 * s, top + 1 * s, 1.6 * s, 1.4 * s);
  ctx.fillStyle = HOUSE_DOOR;
  ctx.fillRect(x + 0.6 * s, top + 1.6 * s, 1.3 * s, base - top - 1.6 * s);
}

function drawLandmark(
  ctx: CanvasRenderingContext2D,
  view: View,
  travel: number,
  targetWorld: number,
  scene: SceneId,
  id: LandmarkId,
  compact: boolean,
): void {
  const z = targetWorld + LANDMARK_AHEAD - travel;
  if (z <= Z_NEAR + 2 || z > 900) return;
  const s = view.f / z;
  const foot = project(view, landmarkX(view, scene, compact), 0, z);
  if (id === "ferris") drawFerris(ctx, foot.x, foot.y, s);
  else if (id === "orange-tree") drawOrangeTree(ctx, foot.x, foot.y, s);
  // 矮手機的回家站在海那一側：小房子放大，草坡墊高，像遠方小島上的家。
  else drawHouse(ctx, foot.x, foot.y, s * landmarkScale(id, compact), compact ? 2.4 : 1.4);
}

/** 道碴前景（16 公尺內）撒兩色圓石點，越遠越小；鋼軌那條不撒。位置跟著世界走，不會閃。 */
function drawPebbles(ctx: CanvasRenderingContext2D, view: View, center: number, travel: number): void {
  for (const z of repeats(travel, 0.8, Z_NEAR, 16)) {
    const row = Math.round((travel + z) / 0.8);
    for (let i = 0; i < 4; i += 1) {
      const seed = row * 7 + i + center * 13;
      const x = center - 1.55 + hashAt(seed) * 3.1;
      if (Math.abs(Math.abs(x - center) - 0.75) < 0.12) continue;
      const p = project(view, x, 0.01, z + hashAt(seed + 5) * 0.6);
      ctx.fillStyle = hashAt(seed + 9) > 0.5 ? PEBBLE_LIGHT : PEBBLE_DARK;
      ctx.beginPath();
      ctx.arc(p.x, p.y, widthAt(view, z, 0.07, 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPortals(
  ctx: CanvasRenderingContext2D,
  view: View,
  travel: number,
  tunnelZ: readonly [number, number] | null,
  postWorld: number,
): void {
  for (const z of repeats(travel, PORTAL_GAP, Z_NEAR + 0.5, Z_FAR)) {
    if (tunnelZ && z >= tunnelZ[0] - 4 && z <= tunnelZ[1] + 4) continue;
    if (!portalVisible(travel + z, postWorld)) continue;
    const width = Math.max(1.5, (view.f / z) * 0.3);
    ctx.globalAlpha = poleAlpha(z);
    ctx.fillStyle = POLE;
    for (const x of [-2.9, 2.3, 7]) {
      const foot = project(view, x, 0, z);
      const top = project(view, x, 6.4, z);
      ctx.fillRect(foot.x - width / 2, top.y, width, foot.y - top.y);
      ctx.beginPath();
      ctx.arc(top.x, top.y, width * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
    const left = project(view, -2.9, 6.2, z);
    const right = project(view, 7, 6.2, z);
    ctx.fillRect(left.x, left.y - width / 2, right.x - left.x, width);
    ctx.globalAlpha = 1;
  }
  const wireWidth = Math.max(1, view.w / 420);
  const wireFar = tunnelZ && tunnelZ[0] > 9 ? tunnelZ[0] : Z_FAR;
  if (wireFar > 9) {
    ctx.globalAlpha = 0.65;
    line(ctx, view, 0, 5.4, 9, wireFar, WIRE, wireWidth);
    line(ctx, view, OTHER_TRACK, 5.4, 9, wireFar, WIRE, wireWidth);
    ctx.globalAlpha = 1;
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, view: View, travel: number, targetWorld: number): void {
  const z0 = Math.max(PLATFORM_NEAR, targetWorld - PLATFORM_BEFORE - travel);
  const z1 = Math.min(Z_FAR, targetWorld + PLATFORM_AFTER - travel);
  if (z1 <= z0) return;
  const edge = -1.9;
  const top = 1.1;
  // 月台下緣一道接地陰影落在道碴上，月台才像放在地上、不是貼紙。
  quad(ctx, view, edge, edge + 0.4, 0.004, z0, z1, BALLAST_SHADE);
  wall(ctx, view, edge, 0, top, z0, z1, PLATFORM_FACE);
  quad(ctx, view, -40, edge, top, z0, z1, PLATFORM_TOP);
  // 月台邊一條亮邊，像黏土圓角受光；黃線粗而圓。
  quad(ctx, view, edge - 0.18, edge, top, z0, z1, PLATFORM_LIP);
  quad(ctx, view, -2.95, -2.4, top, z0, z1, PLATFORM_LINE);

  // 停車柱是「停在這裡」的主要線索：柱身與圓牌都比真的粗大，遠處也至少幾個像素。
  const postZ = stopPostWorld(targetWorld / STATION_WORLD) - travel;
  if (postZ > Z_NEAR + 0.3 && postZ < Z_FAR) {
    const foot = project(view, -2.3, top, postZ);
    const head = project(view, -2.3, top + 2.1, postZ);
    const scale = view.f / postZ;
    const width = Math.max(3, scale * 0.22);
    ctx.fillStyle = POST;
    ctx.fillRect(foot.x - width / 2, head.y, width, foot.y - head.y);
    const radius = Math.max(5, scale * 0.6);
    ctx.beginPath();
    ctx.arc(head.x, head.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = POST_FACE;
    ctx.beginPath();
    ctx.arc(head.x, head.y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 路旁速限牌：圓牌、紅圈、三個格子亮幾格表示快慢。牌上沒有數字。 */
function drawSigns(
  ctx: CanvasRenderingContext2D,
  view: View,
  travel: number,
  signs: readonly SpeedSign[],
): void {
  const list = signs
    .map((sign) => ({ sign, z: sign.at * STATION_WORLD - travel }))
    .filter(({ z }) => z > Z_NEAR + 0.6 && z < 170)
    .sort((a, b) => b.z - a.z);
  for (const { sign, z } of list) {
    const x = -3.4;
    const foot = project(view, x, 0, z);
    const center = project(view, x, 3.3, z);
    const r = widthAt(view, z, 0.8, 3);
    ctx.fillStyle = POLE;
    const pole = widthAt(view, z, 0.12, 1.5);
    ctx.fillRect(foot.x - pole / 2, center.y, pole, foot.y - center.y);
    ctx.fillStyle = SIGN_RING;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SIGN_FACE;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r * 0.74, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgb(176, 160, 146)";
    ctx.lineWidth = Math.max(1, r * 0.05);
    for (const cell of signCells(signBars(sign.limit))) {
      const x = center.x + cell.x * r;
      const y = center.y + cell.y * r;
      if (cell.lit) {
        ctx.fillStyle = INK;
        ctx.fillRect(x, y, cell.w * r, cell.h * r);
      } else {
        // 沒亮的格淡色填滿再描邊；只描邊時遠處的牌三格分不出亮幾格。
        ctx.fillStyle = SIGN_UNLIT;
        ctx.fillRect(x, y, cell.w * r, cell.h * r);
        ctx.strokeRect(x, y, cell.w * r, cell.h * r);
      }
    }
  }
}

/**
 * 出發號誌：灰桿上一個深色圓角燈箱，上面亮綠燈、下面紅燈不亮。
 * 燈箱比真的大，遠處也看得出上下兩顆燈；圖內不寫字。
 */
function drawSignal(ctx: CanvasRenderingContext2D, view: View, travel: number): void {
  const z = SIGNAL_WORLD - travel;
  if (z <= Z_NEAR + 0.6 || z >= Z_FAR) return;
  const foot = project(view, SIGNAL_X, 0, z);
  const head = project(view, SIGNAL_X, SIGNAL_HEAD, z);
  const w = widthAt(view, z, 1.1, 6);
  const h = w * 1.9;
  ctx.fillStyle = POLE;
  const pole = widthAt(view, z, 0.16, 1.5);
  ctx.fillRect(foot.x - pole / 2, head.y, pole, foot.y - head.y);
  const r = w / 2;
  const top = head.y - h / 2;
  const bottom = head.y + h / 2;
  ctx.fillStyle = SIGNAL_BOX;
  ctx.beginPath();
  ctx.arc(head.x, top + r, r, Math.PI, 0);
  ctx.lineTo(head.x + r, bottom - r);
  ctx.arc(head.x, bottom - r, r, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  // 淺色邊：燈箱背後常是隧道口或遠山，深色疊深色會糊在一起。
  ctx.strokeStyle = SIGNAL_RIM;
  ctx.lineWidth = Math.max(1, w * 0.1);
  ctx.stroke();
  const lamp = r * 0.62;
  ctx.fillStyle = SIGNAL_GLOW;
  ctx.beginPath();
  ctx.arc(head.x, top + r, lamp * 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SIGNAL_GO;
  ctx.beginPath();
  ctx.arc(head.x, top + r, lamp, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SIGNAL_OFF;
  ctx.beginPath();
  ctx.arc(head.x, bottom - r, lamp, 0, Math.PI * 2);
  ctx.fill();
}

function drawBridge(ctx: CanvasRenderingContext2D, view: View, z0: number, z1: number): void {
  const a = Math.max(Z_NEAR, z0);
  const b = Math.min(Z_FAR, z1);
  if (b <= a) return;
  const sides = [-2.6, OTHER_TRACK + 2.6];
  const posts: number[] = [];
  for (let z = z0; z <= z1 + 0.01; z += TRUSS_GAP) {
    if (z >= Z_NEAR + 0.4 && z <= Z_FAR) posts.push(z);
  }
  posts.reverse();
  for (const x of sides) {
    line(ctx, view, x, 0.4, a, b, TRUSS_DARK, widthAt(view, a, 0.3, 1.5));
    line(ctx, view, x, 5.2, a, b, TRUSS, widthAt(view, a, 0.3, 1.5));
  }
  for (let i = 0; i < posts.length; i += 1) {
    const z = posts[i]!;
    const lw = widthAt(view, z, 0.26, 1.5);
    for (const x of sides) {
      segment(ctx, project(view, x, 0.4, z), project(view, x, 5.2, z), TRUSS, lw);
      const prev = posts[i - 1];
      if (prev !== undefined) segment(ctx, project(view, x, 0.4, prev), project(view, x, 5.2, z), TRUSS_DARK, lw);
    }
    segment(ctx, project(view, sides[0]!, 5.2, z), project(view, sides[1]!, 5.2, z), TRUSS, lw);
  }
}

/** 隧道口：一座圓圓的小山，中間一個拱形洞口。 */
function archPath(ctx: CanvasRenderingContext2D, view: View, z: number): void {
  const left = -3.4;
  const right = OTHER_TRACK + 3.4;
  const spring = 4.2;
  const bl = project(view, left, 0, z);
  const br = project(view, right, 0, z);
  const sl = project(view, left, spring, z);
  const sr = project(view, right, spring, z);
  const rx = (sr.x - sl.x) / 2;
  const ry = widthAt(view, z, 3.4, 1);
  ctx.beginPath();
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(sl.x, sl.y);
  ctx.ellipse(sl.x + rx, sl.y, rx, ry, 0, Math.PI, 0);
  ctx.lineTo(br.x, br.y);
  ctx.closePath();
}

function drawTunnelMouth(
  ctx: CanvasRenderingContext2D,
  view: View,
  palette: Palette,
  travel: number,
  zA: number,
  zB: number,
): void {
  const base = project(view, -90, 0, zA);
  const baseR = project(view, 90, 0, zA);
  const shoulderL = project(view, -90, 7, zA);
  const shoulderR = project(view, 90, 7, zA);
  const peak = project(view, OTHER_TRACK / 2, 26, zA);
  ctx.fillStyle = palette.mound;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(shoulderL.x, shoulderL.y);
  ctx.quadraticCurveTo(peak.x, peak.y, shoulderR.x, shoulderR.y);
  ctx.lineTo(baseR.x, baseR.y);
  ctx.closePath();
  ctx.fill();

  archPath(ctx, view, zA);
  ctx.fillStyle = TUNNEL_DARK;
  ctx.fill();
  ctx.strokeStyle = PORTAL_RIM;
  ctx.lineWidth = widthAt(view, zA, 0.6, 2);
  ctx.stroke();

  ctx.save();
  archPath(ctx, view, zA);
  ctx.clip();
  if (zB < Z_FAR) {
    archPath(ctx, view, zB);
    ctx.fillStyle = palette.skyLow;
    ctx.fill();
  }
  drawTrack(ctx, view, 0, travel, true, Math.min(Z_FAR, zB));
  ctx.restore();
}

function drawTunnelInside(
  ctx: CanvasRenderingContext2D,
  view: View,
  travel: number,
  zB: number,
  outside: () => void,
): void {
  const { w, h } = view;
  ctx.fillStyle = TUNNEL_DARK;
  ctx.fillRect(0, 0, w, h);
  if (zB < Z_FAR) {
    ctx.save();
    archPath(ctx, view, zB);
    ctx.clip();
    outside();
    ctx.restore();
  }
  drawTrack(ctx, view, 0, travel, true, Math.min(Z_FAR, zB));
  drawTrack(ctx, view, OTHER_TRACK, travel, true, Math.min(Z_FAR, zB));
  for (const z of repeats(travel, LAMP_GAP, Z_NEAR + 0.3, Math.min(Z_FAR, zB))) {
    const r = widthAt(view, z, 0.28, 1.5);
    ctx.fillStyle = TUNNEL_LAMP;
    for (const x of [-3.2, OTHER_TRACK + 3.2]) {
      const p = project(view, x, 4.3, z);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r * 1.6, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** 迎面的原創列車：奶油車身、淡紫腰帶、圓圓的長鼻子。不是任何真實車種的塗裝。 */
function drawOncoming(ctx: CanvasRenderingContext2D, view: View, t: number): void {
  const nose = passingNose(t);
  const tail = nose + PASS_LENGTH;
  if (tail <= Z_NEAR || nose >= Z_FAR) return;
  const left = OTHER_TRACK - 1.3;
  const right = OTHER_TRACK + 1.3;
  const hood = 7;
  const bodyFrom = Math.max(Z_NEAR, nose + hood);
  const bodyTo = Math.min(Z_FAR, tail);
  if (bodyTo > bodyFrom) {
    quad(ctx, view, left, right, 3.5, bodyFrom, bodyTo, TRAIN_ROOF);
    wall(ctx, view, left, 0.5, 3.5, bodyFrom, bodyTo, TRAIN_BODY);
    wall(ctx, view, left, 0.5, 0.9, bodyFrom, bodyTo, TRAIN_SKIRT);
    wall(ctx, view, left, 1.3, 1.7, bodyFrom, bodyTo, TRAIN_STRIPE);
    wall(ctx, view, left, 2.3, 2.9, bodyFrom, bodyTo, TRAIN_WINDOW);
  }
  const lowFrom = Math.max(Z_NEAR, nose);
  const lowTo = Math.min(Z_FAR, nose + hood);
  if (lowTo > lowFrom) {
    wall(ctx, view, left, 0.5, 2.0, lowFrom, lowTo, TRAIN_BODY);
    wall(ctx, view, left, 1.3, 1.7, lowFrom, lowTo, TRAIN_STRIPE);
    poly(
      ctx,
      [project(view, left, 2.0, lowFrom), project(view, left, 2.0, lowTo), project(view, left, 3.5, lowTo)],
      TRAIN_BODY,
    );
  }
  if (nose > Z_NEAR + 0.2) {
    poly(
      ctx,
      [
        project(view, left, 2.0, nose),
        project(view, right, 2.0, nose),
        project(view, right, 3.5, nose + hood),
        project(view, left, 3.5, nose + hood),
      ],
      TRAIN_ROOF,
    );
    poly(
      ctx,
      [
        project(view, left + 0.4, 2.5, nose + 2.4),
        project(view, right - 0.4, 2.5, nose + 2.4),
        project(view, right - 0.5, 3.2, nose + 5.4),
        project(view, left + 0.5, 3.2, nose + 5.4),
      ],
      TRAIN_WINDOW,
    );
    face(ctx, view, left, right, 0.5, 2.0, nose, TRAIN_BODY);
    face(ctx, view, left, right, 1.3, 1.7, nose - 0.01, TRAIN_STRIPE);
    face(ctx, view, left, right, 0.5, 0.8, nose - 0.01, TRAIN_SKIRT);
    const r = widthAt(view, nose, 0.22, 1.5);
    ctx.fillStyle = TRAIN_LAMP;
    for (const x of [left + 0.45, right - 0.45]) {
      const p = project(view, x, 1.05, nose - 0.02);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * 天空、遠景、兩條軌道、電車線門架、速限牌、鐵橋、隧道、對向列車、左邊月台與停車柱。
 * 只有幾何色塊，不貼圖、不模糊、不畫字、不畫真實車頭。
 */
export function drawWindshield(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  paint: WindshieldPaint,
): void {
  const view = viewFor(width, height);
  const scene = paint.scene ?? "field";
  const palette = PALETTES[scene];
  const travel = cameraTravel(paint.reduced, paint.progress, paint.phase, paint.target, {
    tunnel: paint.tunnel,
    bridge: paint.bridge,
  });
  const tunnelZ = paint.tunnel
    ? ([paint.tunnel.from * STATION_WORLD - travel, paint.tunnel.to * STATION_WORLD - travel] as const)
    : null;
  const bridgeZ = paint.bridge
    ? ([paint.bridge.from * STATION_WORLD - travel, paint.bridge.to * STATION_WORLD - travel] as const)
    : null;
  const passing =
    paint.passing == null ? null : paint.reduced ? REDUCED_PASS : paint.passing;

  const outside = () => {
    drawSky(ctx, view, palette, scene);
    if (scene === "city") drawSkyline(ctx, view);
    drawHills(ctx, view, palette, scene);
    drawGround(ctx, view, palette, scene, travel);
    if (bridgeZ) drawWater(ctx, view, bridgeZ[0], bridgeZ[1]);
    if (scene === "city") drawBuildings(ctx, view, travel);
    drawTrees(ctx, view, travel, paint);
    if (paint.landmark) {
      drawLandmark(ctx, view, travel, paint.target * STATION_WORLD, scene, paint.landmark, paint.compact === true);
    }
    drawTrack(ctx, view, OTHER_TRACK, travel);
    drawTrack(ctx, view, 0, travel);
    drawPlatform(ctx, view, travel, paint.target * STATION_WORLD);
    drawSigns(ctx, view, travel, paint.signs ?? []);
    if (passing !== null) drawOncoming(ctx, view, passing);
    if (bridgeZ) drawBridge(ctx, view, bridgeZ[0], bridgeZ[1]);
    drawPortals(ctx, view, travel, tunnelZ, stopPostWorld(paint.target));
    // 號誌最後畫：看得到它的時候，門形線柱、架空線、鐵橋都比它遠，不能從燈上劃過去。
    drawSignal(ctx, view, travel);
  };

  ctx.clearRect(0, 0, width, height);
  if (tunnelZ && tunnelZ[0] <= Z_NEAR && tunnelZ[1] > Z_NEAR) {
    drawTunnelInside(ctx, view, travel, tunnelZ[1], outside);
    return;
  }
  outside();
  if (tunnelZ && tunnelZ[0] > Z_NEAR && tunnelZ[0] < Z_FAR) {
    drawTunnelMouth(ctx, view, palette, travel, tunnelZ[0], tunnelZ[1]);
    const nearSigns = (paint.signs ?? []).filter((sign) => sign.at * STATION_WORLD - travel < tunnelZ[0]);
    drawSigns(ctx, view, travel, nearSigns);
    // 隧道山體很寬，比山腳近的樹也會被它蓋掉只剩一條扁餅；比隧道口近的樹再畫一次。
    drawTrees(ctx, view, travel, paint, tunnelZ[0]);
    if (SIGNAL_WORLD - travel < tunnelZ[0]) drawSignal(ctx, view, travel);
  }
}
