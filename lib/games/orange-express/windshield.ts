import { PASS_DURATION } from "@/lib/games/orange-express/reducer";
import { SIGNAL_UNTIL } from "@/lib/games/orange-express/routes";
import type { Phase, SceneId, SpeedSign, Span } from "@/lib/games/orange-express/types";

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
  hillNear: string;
  ground: string;
  groundAlt: string;
  mound: string;
};

const PALETTES: Record<SceneId, Palette> = {
  field: {
    skyTop: "rgb(150, 204, 238)",
    skyLow: "rgb(222, 240, 252)",
    hillFar: "rgb(176, 214, 170)",
    hillNear: "rgb(150, 198, 140)",
    ground: "rgb(196, 222, 160)",
    groundAlt: "rgb(176, 210, 136)",
    mound: "rgb(140, 186, 126)",
  },
  city: {
    skyTop: "rgb(160, 200, 236)",
    skyLow: "rgb(236, 236, 246)",
    hillFar: "rgb(190, 204, 214)",
    hillNear: "rgb(176, 196, 186)",
    ground: "rgb(214, 210, 196)",
    groundAlt: "rgb(200, 196, 182)",
    mound: "rgb(156, 178, 150)",
  },
  sea: {
    skyTop: "rgb(130, 196, 240)",
    skyLow: "rgb(226, 244, 252)",
    hillFar: "rgb(170, 210, 176)",
    hillNear: "rgb(146, 196, 150)",
    ground: "rgb(200, 224, 166)",
    groundAlt: "rgb(184, 214, 150)",
    mound: "rgb(138, 186, 132)",
  },
};

const CLOUD = "rgb(255, 252, 246)";
const BALLAST = "rgb(214, 204, 186)";
const RAIL = "rgb(120, 116, 112)";
const RAIL_SHINE = "rgb(236, 232, 224)";
const SLEEPER = "rgb(176, 150, 120)";
const POLE = "rgb(132, 140, 150)";
const WIRE = "rgb(110, 116, 124)";
export const PLATFORM_TOP = "rgb(250, 230, 200)";
const PLATFORM_FACE = "rgb(214, 176, 134)";
const PLATFORM_LINE = "rgb(255, 210, 90)";
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
};

type View = { w: number; h: number; vx: number; hy: number; f: number };

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

  ctx.fillStyle = CLOUD;
  for (const [cx, cy, r] of [
    [0.2, 0.14, 0.05],
    [0.62, 0.09, 0.04],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(w * cx, h * cy, w * r * 1.8, h * r, 0, 0, Math.PI * 2);
    ctx.ellipse(w * (cx + r), h * (cy - r * 0.6), w * r * 1.1, h * r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills(ctx: CanvasRenderingContext2D, view: View, palette: Palette, scene: SceneId): void {
  const { w, h, hy } = view;
  const right = scene === "sea" ? 0.46 : 1;
  ctx.fillStyle = palette.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, hy);
  ctx.quadraticCurveTo(w * 0.18 * right, hy - h * 0.1, w * 0.38 * right, hy - h * 0.02);
  if (scene !== "sea") {
    ctx.quadraticCurveTo(w * 0.6, hy - h * 0.12, w * 0.82, hy - h * 0.03);
    ctx.quadraticCurveTo(w * 0.92, hy - h * 0.07, w, hy - h * 0.04);
    ctx.lineTo(w, hy + 1);
  } else {
    ctx.quadraticCurveTo(w * 0.42, hy - h * 0.01, w * right, hy + 1);
  }
  ctx.lineTo(0, hy + 1);
  ctx.closePath();
  ctx.fill();
  if (scene === "field") {
    ctx.fillStyle = palette.hillNear;
    ctx.beginPath();
    ctx.moveTo(w * 0.55, hy + 1);
    ctx.quadraticCurveTo(w * 0.78, hy - h * 0.06, w, hy - h * 0.01);
    ctx.lineTo(w, hy + 1);
    ctx.closePath();
    ctx.fill();
  }
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
  quad(ctx, view, center - 1.7, center + 1.7, 0, Z_NEAR, zFar, dim ? TUNNEL_FLOOR : BALLAST);
  const offset = ((travel % SLEEPER_GAP) + SLEEPER_GAP) % SLEEPER_GAP;
  for (let z = Z_NEAR + SLEEPER_GAP - offset; z < Math.min(70, zFar); z += SLEEPER_GAP) {
    quad(ctx, view, center - 1.25, center + 1.25, 0, z, z + 0.24, dim ? TUNNEL_DARK : SLEEPER);
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
    const width = Math.max(1.5, (view.f / z) * 0.22);
    ctx.fillStyle = POLE;
    for (const x of [-2.9, 2.3, 7]) {
      const foot = project(view, x, 0, z);
      const top = project(view, x, 6.4, z);
      ctx.fillRect(foot.x - width / 2, top.y, width, foot.y - top.y);
    }
    const left = project(view, -2.9, 6.2, z);
    const right = project(view, 7, 6.2, z);
    ctx.fillRect(left.x, left.y - width / 2, right.x - left.x, width);
  }
  const wireWidth = Math.max(1, view.w / 420);
  const wireFar = tunnelZ && tunnelZ[0] > 9 ? tunnelZ[0] : Z_FAR;
  if (wireFar > 9) {
    line(ctx, view, 0, 5.4, 9, wireFar, WIRE, wireWidth);
    line(ctx, view, OTHER_TRACK, 5.4, 9, wireFar, WIRE, wireWidth);
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, view: View, travel: number, targetWorld: number): void {
  const z0 = Math.max(PLATFORM_NEAR, targetWorld - PLATFORM_BEFORE - travel);
  const z1 = Math.min(Z_FAR, targetWorld + PLATFORM_AFTER - travel);
  if (z1 <= z0) return;
  const edge = -1.9;
  const top = 1.1;
  wall(ctx, view, edge, 0, top, z0, z1, PLATFORM_FACE);
  quad(ctx, view, -40, edge, top, z0, z1, PLATFORM_TOP);
  quad(ctx, view, -2.75, -2.45, top, z0, z1, PLATFORM_LINE);

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
  const view: View = {
    w: width,
    h: height,
    vx: width * 0.5,
    hy: height * 0.42,
    f: (height * 0.58 * Z_NEAR) / EYE,
  };
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
    if (SIGNAL_WORLD - travel < tunnelZ[0]) drawSignal(ctx, view, travel);
  }
}
