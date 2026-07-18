import { CAR_ADVENTURE_LEVELS } from "@/lib/games/car-adventure/levels";
import {
  lerp,
  ROWS,
  TILE,
  VH,
  VW,
  type GameState,
} from "@/lib/games/car-adventure/types";

/**
 * Car Adventure 黏土風美術色（component-local allowlist）。
 * canvas 讀不到 CSS 變數，故以 JS 常數鏡射 DESIGN.md 的 --c-* token 與 --ink。
 */
const CLAY = {
  ink: "#34302b",
  pink: "#f7a8c4",
  yellow: "#ffd866",
  mint: "#b7df9b",
  sky: "#8fcde8",
  teal: "#79c8c1",
  lilac: "#c5b3e6",
  // 地形／點綴衍生色（同一色相的深淺階，非品牌語意色）
  soil: "#f0c795",
  soilEdge: "#d9a566",
  grassEdge: "#93c979",
  coinRim: "#e8b64a",
  spike: "#f27ba0",
  cloud: "rgba(255,255,255,.9)",
  hudPanel: "rgba(255,255,255,.82)",
  brick: "#e8b06a",
  brickSeam: "rgba(120,80,40,.5)",
} as const;

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.arc(x + 18, y + 4, 13, 0, Math.PI * 2);
  ctx.arc(x - 16, y + 5, 12, 0, Math.PI * 2);
  ctx.fill();
}

/** 星星點綴（黃昏／夜間主題）：四角光芒＋圓心，靜態不閃爍。 */
function star(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const r = 6;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.28, y - r * 0.28);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.28, y + r * 0.28);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.28, y + r * 0.28);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.28, y - r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}

/** 圓潤黏土小樹（森林主題）：樹冠疊圓＋樹幹；樹冠色沿用呼叫端 fillStyle。 */
function tree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  canopy: string,
): void {
  ctx.fillStyle = "#a9764f";
  ctx.fillRect(x - 3, y + 10, 6, 14);
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.arc(x - 12, y + 8, 11, 0, Math.PI * 2);
  ctx.arc(x + 12, y + 8, 11, 0, Math.PI * 2);
  ctx.fill();
}

/** 浪花小弧（海洋主題）：白色泡沫圓弧。 */
function wave(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 14, Math.PI * 0.15, Math.PI * 0.85);
  ctx.arc(x + 20, y + 3, 10, Math.PI * 0.15, Math.PI * 0.85);
  ctx.arc(x - 18, y + 4, 9, Math.PI * 0.15, Math.PI * 0.85);
  ctx.fill();
}

type Deco = "cloud" | "star" | "tree" | "wave";

interface WorldTheme {
  /** 天空漸層（上→下）。 */
  skyTop: string;
  skyBottom: string;
  /** 點綴元素色（雲／星星／樹／浪花）。 */
  decoColor: string;
  decoKind: Deco;
  /** 遠景色帶（0.32 視差，藏在近景丘後方的縫隙間，營造層次）。 */
  far: string;
  /** 近景丘色。 */
  hill: string;
  /** 天空日照／月光柔暈色（靜態柔光，加大氣層次）。 */
  glow: string;
}

/**
 * 每關主題表（依 g.levelIndex 對映，非 levels.ts schema 欄位）。
 * 6 關對映 6 個主題：草原薄荷／粉彩彩虹／海洋藍綠／森林深綠／黃昏星空／夜間嘉年華。
 */
const WORLD_THEMES: WorldTheme[] = [
  // level-01 草原出發：草原薄荷（沿用改版前的基準配色）
  {
    skyTop: CLAY.sky,
    skyBottom: "#eaf7ff",
    decoColor: CLAY.cloud,
    decoKind: "cloud",
    far: "#d7efe0",
    hill: CLAY.mint,
    glow: "rgba(255,244,198,.55)",
  },
  // level-02 彩虹捷徑：粉彩彩虹（粉／薰衣草天空）
  {
    skyTop: "#ffd3ea",
    skyBottom: "#fff1f8",
    decoColor: "rgba(255,255,255,.92)",
    decoKind: "cloud",
    far: "#f3d9f7",
    hill: CLAY.lilac,
    glow: "rgba(255,255,255,.62)",
  },
  // level-03 高低起伏：海洋藍綠
  {
    skyTop: "#6fc9d6",
    skyBottom: "#d8f3ee",
    decoColor: "rgba(255,255,255,.85)",
    decoKind: "wave",
    far: "#bfe9df",
    hill: CLAY.teal,
    glow: "rgba(255,250,214,.5)",
  },
  // level-04 尖刺迷宮：森林深綠
  {
    skyTop: "#9bc97f",
    skyBottom: "#eaf5da",
    decoColor: "#3f7a3d",
    decoKind: "tree",
    far: "#79b563",
    hill: "#5a9a52",
    glow: "rgba(255,247,205,.45)",
  },
  // level-05 空中走廊：黃昏 lilac/pink 星空
  {
    skyTop: "#8b7ec9",
    skyBottom: "#f6c6d6",
    decoColor: "rgba(255,255,255,.85)",
    decoKind: "star",
    far: "#a68fd6",
    hill: CLAY.lilac,
    glow: "rgba(255,206,158,.5)",
  },
  // level-06 終極大冒險：夜間嘉年華（收尾關，更深的紫夜）
  {
    skyTop: "#4c3f7a",
    skyBottom: "#c789b0",
    decoColor: "rgba(255,255,255,.75)",
    decoKind: "star",
    far: "#6b57a0",
    hill: "#7a5aa6",
    glow: "rgba(216,222,255,.42)",
  },
];

/** 黏土地形磚：暖沙色土塊；表層磚加圓角草皮帽。 */
function drawClayGroundTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tilePx: number,
  hasGrassTop: boolean,
): void {
  ctx.fillStyle = CLAY.soil;
  ctx.fillRect(sx, sy, tilePx, tilePx);
  ctx.fillStyle = CLAY.soilEdge;
  ctx.fillRect(sx, sy + tilePx - 3, tilePx, 3);
  // 黏土斑點紋理：兩顆深沙色小點，位置依 tile 座標決定（穩定、不閃爍）。
  ctx.fillStyle = "rgba(200,150,90,.28)";
  const d0 = (Math.abs(Math.round(sx)) % 5) + 4;
  const d1 = (Math.abs(Math.round(sy)) % 4) + 3;
  ctx.beginPath();
  ctx.arc(sx + d0 + 2, sy + tilePx * 0.5, 1.4, 0, Math.PI * 2);
  ctx.arc(sx + tilePx - d1 - 2, sy + tilePx * 0.72, 1.2, 0, Math.PI * 2);
  ctx.fill();
  if (hasGrassTop) {
    const capH = Math.round(tilePx * 0.38);
    ctx.fillStyle = CLAY.mint;
    rr(ctx, sx - 1, sy - 2, tilePx + 2, capH + 2, 7);
    ctx.fill();
    ctx.fillStyle = CLAY.grassEdge;
    rr(ctx, sx - 1, sy + capH - 4, tilePx + 2, 4, 2);
    ctx.fill();
    // 草皮高光：黏土捏痕
    ctx.fillStyle = "rgba(255,255,255,.35)";
    rr(ctx, sx + 4, sy + 1, tilePx * 0.4, 3, 2);
    ctx.fill();
    // 草叢：草帽上冒出的圓潤小草葉，加地表細節與景深。
    ctx.fillStyle = CLAY.grassEdge;
    for (const gx of [sx + 8, sx + tilePx - 10]) {
      ctx.beginPath();
      ctx.moveTo(gx, sy - 1);
      ctx.quadraticCurveTo(gx + 2, sy - 8, gx + 5, sy - 2);
      ctx.quadraticCurveTo(gx + 2, sy - 4, gx, sy - 1);
      ctx.fill();
    }
  }
}

/** 可破壞磚：焦糖磚身＋十字磚縫＋高光（與地形土塊區隔，一眼可辨可撞）。 */
function drawBreakableTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tilePx: number,
): void {
  ctx.fillStyle = CLAY.brick;
  rr(ctx, sx + 1, sy + 1, tilePx - 2, tilePx - 2, 6);
  ctx.fill();
  ctx.strokeStyle = CLAY.brickSeam;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(sx + tilePx / 2, sy + 4);
  ctx.lineTo(sx + tilePx / 2, sy + tilePx - 4);
  ctx.moveTo(sx + 5, sy + tilePx / 2);
  ctx.lineTo(sx + tilePx - 5, sy + tilePx / 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.4)";
  rr(ctx, sx + 4, sy + 3, tilePx * 0.35, 3, 2);
  ctx.fill();
}

/** 移動平台：薰衣草黏土板＋柔影＋頂面高光（一眼可辨為可站/會動）。 */
function drawMovingPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = "rgba(52,48,43,.14)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 3, w / 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CLAY.lilac;
  rr(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.4)";
  rr(ctx, x + 4, y + 2, w - 8, 3, 2);
  ctx.fill();
  ctx.fillStyle = "rgba(120,90,160,.5)";
  rr(ctx, x, y + h - 3, w, 3, 2);
  ctx.fill();
}

/** 糖果金幣：奶油黃圓餅＋光點。 */
function drawClayCoin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.fillStyle = CLAY.coinRim;
  ctx.beginPath();
  ctx.arc(x, y + 1, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CLAY.yellow;
  ctx.beginPath();
  ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.beginPath();
  ctx.arc(x - radius * 0.32, y - radius * 0.32, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

/** 軟糖尖刺：圓頭粉色糖錐（仍需一眼可辨為危險物）。 */
function drawClaySpike(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tilePx: number,
): void {
  const half = tilePx / 2;
  for (const off of [0, half]) {
    const cx = sx + off + half / 2;
    ctx.fillStyle = CLAY.spike;
    ctx.beginPath();
    ctx.moveTo(sx + off + 2, sy + tilePx);
    ctx.quadraticCurveTo(cx, sy + 2, sx + off + half - 2, sy + tilePx);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.beginPath();
    ctx.arc(cx, sy + tilePx * 0.35, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 黏土車車：圓潤車身＋車臉（眼睛/微笑/腮紅），
 * 造型語彙對齊 CandyMatchPieceArt 的車車角色。
 */
function drawCar(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  w: number,
  h: number,
  body: string,
  roof: string,
  facing: number,
  mood: "happy" | "grumpy",
): void {
  ctx.save();
  ctx.translate(sx + w / 2, sy + h / 2);
  if (facing < 0) ctx.scale(-1, 1);
  ctx.translate(-w / 2, -h / 2);
  // 柔影
  ctx.fillStyle = "rgba(52,48,43,.15)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h + 2, w / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // 輪子：深色胎＋奶油輪圈
  ctx.fillStyle = CLAY.ink;
  [w * 0.27, w * 0.75].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, h - 3, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#fff6e0";
  [w * 0.27, w * 0.75].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, h - 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
  });
  // 一體式圓潤車身（黏土團）
  ctx.fillStyle = body;
  rr(ctx, 0, h * 0.32, w, h * 0.55, 8);
  ctx.fill();
  ctx.fillStyle = roof;
  rr(ctx, w * 0.22, h * 0.02, w * 0.56, h * 0.48, 9);
  ctx.fill();
  // 車窗＝臉底
  ctx.fillStyle = "#ffffff";
  rr(ctx, w * 0.3, h * 0.1, w * 0.42, h * 0.32, 7);
  ctx.fill();
  // 眼睛
  ctx.fillStyle = CLAY.ink;
  const eyeY = h * 0.24;
  ctx.beginPath();
  ctx.arc(w * 0.42, eyeY, 1.9, 0, Math.PI * 2);
  ctx.arc(w * 0.6, eyeY, 1.9, 0, Math.PI * 2);
  ctx.fill();
  // 嘴：微笑（玩家）／抿嘴（搗蛋車）
  ctx.strokeStyle = CLAY.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mood === "happy") {
    ctx.arc(w * 0.51, eyeY + 3.4, 3.2, Math.PI * 0.15, Math.PI * 0.85);
  } else {
    ctx.moveTo(w * 0.45, eyeY + 5.6);
    ctx.lineTo(w * 0.58, eyeY + 5.6);
  }
  ctx.stroke();
  // 腮紅
  ctx.fillStyle = "rgba(247,168,196,.8)";
  ctx.beginPath();
  ctx.arc(w * 0.35, eyeY + 3.6, 1.8, 0, Math.PI * 2);
  ctx.arc(w * 0.67, eyeY + 3.6, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // 車頭燈
  ctx.fillStyle = "#fff3b0";
  ctx.beginPath();
  ctx.arc(w - 4, h * 0.58, 3, 0, Math.PI * 2);
  ctx.fill();
  // 車身高光：黏土捏痕
  ctx.fillStyle = "rgba(255,255,255,.35)";
  rr(ctx, w * 0.08, h * 0.38, w * 0.2, 3.4, 2);
  ctx.fill();
  ctx.restore();
}

/** 飄浮尖刺球（floater）：紅球＋尖刺光環＋皺眉，一眼可辨為危險、不可踩。 */
function drawFloater(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2 + 2;
  ctx.fillStyle = CLAY.spike;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.lineTo(
      cx + Math.cos(a + 0.28) * (r - 6),
      cy + Math.sin(a + 0.28) * (r - 6),
    );
    ctx.lineTo(
      cx + Math.cos(a - 0.28) * (r - 6),
      cy + Math.sin(a - 0.28) * (r - 6),
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CLAY.ink;
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 2, 1.8, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = CLAY.ink;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 5);
  ctx.lineTo(cx + 4, cy + 5);
  ctx.stroke();
}

/** 終點旗：圓潤木牌桿＋波浪格紋旗。 */
function drawFinishFlag(
  ctx: CanvasRenderingContext2D,
  fx: number,
  fy: number,
  fh: number,
): void {
  ctx.fillStyle = "#b48a5a";
  rr(ctx, fx + TILE / 2 - 2.5, fy - 8, 5, fh + 8, 2.5);
  ctx.fill();
  const flagX = fx + TILE / 2 + 3;
  ctx.fillStyle = "#ffffff";
  rr(ctx, flagX, fy - 6, 26, 26, 5);
  ctx.fill();
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      if ((i + j) % 2 === 0) continue;
      ctx.fillStyle = CLAY.pink;
      rr(ctx, flagX + 2 + j * 7.4, fy - 4 + i * 7.4, 7, 7, 2.5);
      ctx.fill();
    }
}

/** 繪製世界（關卡、車、金幣等）；不含 HUD。 */
export function renderAdventureWorld(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  reduced: boolean,
): void {
  const cam = g.cam;
  const px = reduced ? 0 : cam;
  const theme = WORLD_THEMES[g.levelIndex % WORLD_THEMES.length];
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, VH);
  // 日照／月光柔暈：靜態 radial，藏在天空右上，加大氣層次（無視差、不隨關卡動）。
  const glowX = VW * 0.78;
  const glowY = 74;
  const glow = ctx.createRadialGradient(glowX, glowY, 6, glowX, glowY, 120);
  glow.addColorStop(0, theme.glow);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VW, VH * 0.6);
  // 遠景點綴層（雲／星星／樹／浪花），視差 0.2；reduced 時靜止。
  ctx.fillStyle = theme.decoColor;
  for (let i = 0; i < 8; i++) {
    const cx =
      (((i * 260 - px * 0.2) % (VW + 260)) + (VW + 260)) % (VW + 260) - 130;
    const cy = 50 + (i % 3) * 36;
    if (theme.decoKind === "star") star(ctx, cx, cy);
    else if (theme.decoKind === "tree") tree(ctx, cx, cy + 40, theme.decoColor);
    else if (theme.decoKind === "wave") wave(ctx, cx, cy + 60);
    else cloud(ctx, cx, cy);
  }
  // 遠景色帶層，視差 0.32：藏在近景丘縫隙間，加一層深度。
  ctx.fillStyle = theme.far;
  for (let i = 0; i < 10; i++) {
    const fx =
      (((i * 260 - px * 0.32) % (VW + 260)) + (VW + 260)) % (VW + 260) - 130;
    ctx.beginPath();
    ctx.moveTo(fx, VH);
    ctx.quadraticCurveTo(fx + 130, VH - 100, fx + 260, VH);
    ctx.fill();
  }
  // 近景丘層，視差 0.45。
  ctx.fillStyle = theme.hill;
  for (let i = 0; i < 12; i++) {
    const hx =
      (((i * 220 - px * 0.45) % (VW + 220)) + (VW + 220)) % (VW + 220) - 110;
    ctx.beginPath();
    ctx.moveTo(hx, VH);
    ctx.quadraticCurveTo(hx + 110, VH - 150, hx + 220, VH);
    ctx.fill();
  }

  const tx0 = Math.floor(cam / TILE) - 1;
  const tx1 = Math.floor((cam + VW) / TILE) + 1;
  for (let ty = 0; ty < ROWS; ty++)
    for (let tx = tx0; tx <= tx1; tx++) {
      if (!g.lv.solid.has(`${tx},${ty}`)) continue;
      const sx = tx * TILE - cam;
      const sy = ty * TILE;
      drawClayGroundTile(
        ctx,
        sx,
        sy,
        TILE,
        !g.lv.solid.has(`${tx},${ty - 1}`),
      );
    }

  for (const key of g.lv.breakable) {
    if (g.broken.has(key)) continue;
    const [tx, ty] = key.split(",").map(Number);
    drawBreakableTile(ctx, tx * TILE - cam, ty * TILE, TILE);
  }

  for (const key of g.lv.spikes) {
    const [tx, ty] = key.split(",").map(Number);
    drawClaySpike(ctx, tx * TILE - cam, ty * TILE, TILE);
  }

  for (const pf of g.lv.movingPlatforms) {
    drawMovingPlatform(ctx, pf.x - cam, pf.y, pf.w, pf.h);
  }

  for (const c of g.lv.coins) {
    if (c.taken) continue;
    drawClayCoin(ctx, c.x - cam, c.y, 9);
  }

  const f = g.lv.finish;
  drawFinishFlag(ctx, f.x - cam, f.y, f.h);

  for (const e of g.lv.enemies) {
    if (!e.alive) continue;
    if (e.kind === "floater") {
      drawFloater(ctx, e.x - cam, e.y, e.w, e.h);
    } else if (e.kind === "hopper") {
      // 彈跳車：青綠車身與粉色巡邏車區隔（皆可踩）。
      drawCar(ctx, e.x - cam, e.y, e.w, e.h, CLAY.teal, "#4f9e97", e.dir, "grumpy");
    } else {
      drawCar(ctx, e.x - cam, e.y, e.w, e.h, CLAY.pink, "#e087aa", e.dir, "grumpy");
    }
  }

  const p = g.player;
  const drawX = lerp(g.prevPlayer.x, p.x, g.renderAlpha);
  const drawY = lerp(g.prevPlayer.y, p.y, g.renderAlpha);
  if (!(p.invuln > 0 && Math.floor(p.invuln * 12) % 2))
    drawCar(
      ctx,
      drawX - cam,
      drawY,
      p.w,
      p.h,
      CLAY.yellow,
      "#e8b64a",
      p.facing,
      "happy",
    );
}

const HUD_FONT =
  '700 11px "jf-open 粉圓", "Baloo 2", "PingFang TC", system-ui, sans-serif';

/** HUD：白色圓角面板＋圖示化計數（金幣／愛心／關卡），取代像素字。 */
export function drawAdventureHud(
  ctx: CanvasRenderingContext2D,
  g: GameState,
): void {
  ctx.save();
  ctx.font = HUD_FONT;
  ctx.textBaseline = "middle";
  const panelH = 20;
  const gapY = 4;
  const entries: Array<{
    icon: (x: number, y: number) => void;
    text: string;
  }> = [
    {
      icon: (x, y) => drawClayCoin(ctx, x, y, 6),
      text: `${g.taken}/${g.lv.total} · ${g.score}`,
    },
    {
      icon: (x, y) => {
        ctx.fillStyle = CLAY.spike;
        ctx.beginPath();
        ctx.moveTo(x, y + 5);
        ctx.bezierCurveTo(x - 7, y - 1, x - 4, y - 6, x, y - 2);
        ctx.bezierCurveTo(x + 4, y - 6, x + 7, y - 1, x, y + 5);
        ctx.fill();
      },
      text: `${g.lives}`,
    },
    {
      icon: (x, y) => {
        drawFinishFlag(ctx, x - TILE / 2, y - 8, 10);
      },
      text: `${g.levelIndex + 1}/${CAR_ADVENTURE_LEVELS.length}`,
    },
  ];
  let y = 8;
  for (const entry of entries) {
    const textW = ctx.measureText(entry.text).width;
    ctx.fillStyle = CLAY.hudPanel;
    rr(ctx, 6, y, 26 + textW + 10, panelH, 10);
    ctx.fill();
    entry.icon(6 + 14, y + panelH / 2);
    ctx.fillStyle = CLAY.ink;
    ctx.fillText(entry.text, 6 + 26, y + panelH / 2 + 0.5);
    y += panelH + gapY;
  }

  // 小型關卡進度條：讓孩子知道終點在哪裡，降低「還要走多久」的不確定感。
  const finish = g.lv.finish;
  const span = Math.max(1, finish.x - g.lv.start.x);
  const progress = Math.max(0, Math.min(1, (g.player.x - g.lv.start.x) / span));
  const barX = 6;
  const barY = 166;
  const barW = 142;
  ctx.fillStyle = CLAY.hudPanel;
  rr(ctx, barX, barY, barW, 8, 4);
  ctx.fill();
  ctx.fillStyle = CLAY.yellow;
  rr(ctx, barX + 2, barY + 2, Math.max(4, (barW - 4) * progress), 4, 2);
  ctx.fill();
  ctx.fillStyle = CLAY.ink;
  ctx.font = '700 9px "jf-open 粉圓", "Baloo 2", "PingFang TC", system-ui, sans-serif';
  ctx.fillText(`${Math.round(progress * 100)}% 到終點`, barX + barW + 6, barY + 4.5);
  ctx.restore();
}
