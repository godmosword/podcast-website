import { drawPixelText } from "@/lib/gamekit/runtime/style";
import {
  drawAdventureCoin,
  drawAdventureGroundTile,
  drawAdventureSpike,
} from "@/lib/gamekit/runtime/tileset-draw";
import { CAR_ADVENTURE_LEVELS } from "@/lib/games/car-adventure/levels";
import {
  lerp,
  ROWS,
  TILE,
  VH,
  VW,
  type GameState,
} from "@/lib/games/car-adventure/types";

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

function drawCar(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  w: number,
  h: number,
  body: string,
  roof: string,
  facing: number,
): void {
  ctx.save();
  ctx.translate(sx + w / 2, sy + h / 2);
  if (facing < 0) ctx.scale(-1, 1);
  ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h + 2, w / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222831";
  [w * 0.27, w * 0.75].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, h - 3, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#9aa3b2";
  [w * 0.27, w * 0.75].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, h - 3, 2.4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = body;
  rr(ctx, 1, h * 0.4, w - 2, h * 0.45, 6);
  ctx.fill();
  ctx.fillStyle = roof;
  rr(ctx, w * 0.28, h * 0.1, w * 0.46, h * 0.4, 6);
  ctx.fill();
  ctx.fillStyle = "#bfe8ff";
  rr(ctx, w * 0.34, h * 0.17, w * 0.34, h * 0.26, 4);
  ctx.fill();
  ctx.fillStyle = "#fff3b0";
  ctx.beginPath();
  ctx.arc(w - 4, h * 0.6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 繪製世界（關卡、車、金幣等）；不含 HUD。 */
export function renderAdventureWorld(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  reduced: boolean,
): void {
  const cam = g.cam;
  const px = reduced ? 0 : cam;
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, "#8fd3ff");
  sky.addColorStop(1, "#dff3ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = "rgba(255,255,255,.85)";
  for (let i = 0; i < 8; i++) {
    const cx =
      (((i * 260 - px * 0.2) % (VW + 260)) + (VW + 260)) % (VW + 260) - 130;
    cloud(ctx, cx, 50 + (i % 3) * 36);
  }
  ctx.fillStyle = "#7fc98a";
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
      drawAdventureGroundTile(
        ctx,
        sx,
        sy,
        TILE,
        !g.lv.solid.has(`${tx},${ty - 1}`),
      );
    }

  for (const key of g.lv.spikes) {
    const [tx, ty] = key.split(",").map(Number);
    drawAdventureSpike(ctx, tx * TILE - cam, ty * TILE, TILE);
  }

  for (const c of g.lv.coins) {
    if (c.taken) continue;
    drawAdventureCoin(ctx, c.x - cam, c.y, 9);
  }

  const f = g.lv.finish;
  const fx = f.x - cam;
  ctx.fillStyle = "#888";
  ctx.fillRect(fx + TILE / 2 - 2, f.y - 8, 4, f.h + 8);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++) {
      ctx.fillStyle = (i + j) % 2 ? "#fff" : "#ff5252";
      ctx.fillRect(fx + TILE / 2 + 2 + j * 8, f.y - 6 + i * 8, 8, 8);
    }

  for (const e of g.lv.enemies)
    if (e.alive)
      drawCar(ctx, e.x - cam, e.y, e.w, e.h, "#ff6b6b", "#d64545", e.dir);

  const p = g.player;
  const drawX = lerp(g.prevPlayer.x, p.x, g.renderAlpha);
  const drawY = lerp(g.prevPlayer.y, p.y, g.renderAlpha);
  if (!(p.invuln > 0 && Math.floor(p.invuln * 12) % 2))
    drawCar(ctx, drawX - cam, drawY, p.w, p.h, "#ffd23f", "#e0a800", p.facing);
}

export function drawAdventureHud(
  ctx: CanvasRenderingContext2D,
  g: GameState,
): void {
  drawPixelText(ctx, `SC ${g.score}`, 8, 6, { scale: 1, shadow: true });
  drawPixelText(ctx, `C ${g.taken}/${g.lv.total}`, 8, 18, { scale: 1 });
  drawPixelText(ctx, `HP ${g.lives}`, 8, 30, { scale: 1 });
  drawPixelText(
    ctx,
    `L${g.levelIndex + 1}/${CAR_ADVENTURE_LEVELS.length}`,
    8,
    42,
    { scale: 1 },
  );
}
