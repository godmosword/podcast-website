import { Kart } from "./kart";
import {
  CX,
  CY,
  H,
  RX_IN,
  RX_OUT,
  RY_IN,
  RY_OUT,
  TREASURES,
  W,
} from "./tracks";
import type { Cannonball } from "./types";

// ── 繪圖（16-bit 熱帶像素風）────────────────────────────────
export function drawScene(
  ctx: CanvasRenderingContext2D,
  karts: Kart[],
  balls: Cannonball[],
  wave: number,
): void {
  ctx.imageSmoothingEnabled = false;

  // 海水
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 8) {
    ctx.fillStyle = y % 16 === 0 ? "#0369a1" : "#0ea5e9";
    ctx.fillRect(0, y, W, 4);
  }

  // 沙洲賽道
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX_OUT, RY_OUT, 0, 0, Math.PI * 2);
  ctx.fill();

  // 內島草地
  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX_IN, RY_IN, 0, 0, Math.PI * 2);
  ctx.fill();

  // 賽道邊線
  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX_OUT, RY_OUT, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX_IN, RY_IN, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 起點線
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(CX - 3 + (i % 2) * 6, CY - RY_OUT - 2, 6, 8);
  }

  // 棕櫚樹（障礙裝飾）
  drawPalm(ctx, 250, 95);
  drawPalm(ctx, 145, 210);
  drawPalm(ctx, 310, 200);

  // 寶藏
  for (const t of TREASURES) {
    if (t.taken) continue;
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(t.x - 5, t.y - 4, 10, 8);
    ctx.fillStyle = "#92400e";
    ctx.fillRect(t.x - 6, t.y + 2, 12, 3);
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(t.x - 2, t.y - 6, 4, 3);
  }

  // 卡丁車
  for (const k of karts) drawKart(ctx, k, wave);

  // 砲彈
  for (const b of balls) {
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f97316";
    ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
  }
}

function drawPalm(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#92400e";
  ctx.fillRect(x - 2, y, 4, 14);
  ctx.fillStyle = "#15803d";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(a) * 8,
      y - 4 + Math.sin(a) * 4,
      8,
      4,
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawKart(ctx: CanvasRenderingContext2D, k: Kart, wave: number): void {
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.angle);

  // 船身
  ctx.fillStyle = k.color;
  ctx.fillRect(-8, -12, 16, 22);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-9, 8, 18, 3);

  // 帆
  const sailWave = k.boostTimer > 0 ? Math.sin(wave * 0.3) * 2 : 0;
  ctx.fillStyle = k.sailColor;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -24 + sailWave);
  ctx.lineTo(10, -12);
  ctx.closePath();
  ctx.fill();

  // 海盜旗
  if (k.isPlayer) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-1, -22, 2, 8);
    ctx.fillStyle = "#fff";
    ctx.fillRect(1, -22, 6, 5);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(2, -20, 1, 1);
    ctx.fillRect(4, -19, 1, 1);
    ctx.fillRect(3, -18, 1, 1);
  }

  if (k.stunTimer > 0) {
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = "#fff",
): void {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.font = "bold 10px monospace";
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
