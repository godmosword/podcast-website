import { CANONICAL_SITE_URL, SITE_NAME } from "@/lib/site-url";

/**
 * K-10（兒童減法審）：下載的著色作品加品牌邊框。
 * 家長拿到就能直接貼 IG／Threads；孩子看到的是自己的畫變成一張卡。
 * 邊框只有站名、網址、角落小車車——不加圖章、貼紙、任何遊戲化元素。
 */

export type FrameLayout = {
  /** 整張輸出尺寸 */
  width: number;
  height: number;
  /** 作品貼上的位置（正方形） */
  art: { x: number; y: number; size: number };
  /** 底部品牌列 */
  footer: { y: number; height: number };
  /** 角落吉祥物的位置與尺寸（依 mascot 480×360 等比） */
  mascot: { x: number; y: number; width: number; height: number };
  /** 文字基準 */
  text: { x: number; nameY: number; urlY: number; nameSize: number; urlSize: number };
  /** 邊距／圓角 */
  pad: number;
  radius: number;
};

export const FRAME_SITE_NAME = SITE_NAME;
export const FRAME_SITE_URL = CANONICAL_SITE_URL.replace(/^https?:\/\//, "");

/** 純函數：由作品邊長算出邊框版面。作品 1024 → 輸出 1184×1328。 */
export function frameLayout(artSize: number): FrameLayout {
  const pad = Math.round(artSize * 0.078);
  const footerH = Math.round(artSize * 0.14);
  const width = artSize + pad * 2;
  const height = artSize + pad * 2 + footerH;
  const mascotH = Math.round(footerH * 0.78);
  const mascotW = Math.round((mascotH * 480) / 360);
  const footerY = pad + artSize + Math.round(pad * 0.4);
  return {
    width,
    height,
    art: { x: pad, y: pad, size: artSize },
    footer: { y: footerY, height: footerH },
    mascot: {
      x: width - pad - mascotW,
      y: footerY + Math.round((footerH - mascotH) / 2),
      width: mascotW,
      height: mascotH,
    },
    text: {
      x: pad,
      nameY: footerY + Math.round(footerH * 0.42),
      urlY: footerY + Math.round(footerH * 0.78),
      nameSize: Math.round(footerH * 0.34),
      urlSize: Math.round(footerH * 0.2),
    },
    pad,
    radius: Math.round(artSize * 0.03),
  };
}

const PAPER = "#fff7ea";
const MAT = "#ffffff";
const INK = "#5a3a1e";
const INK_SOFT = "#8a6d5a";
const LINE = "#f0dcc4";

function roundRect(
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

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * 把作品畫進品牌邊框，回傳新的 canvas。吉祥物載不到就略過（邊框其餘照畫）。
 */
export async function renderFramedArtwork(
  art: HTMLCanvasElement,
  options: { mascotSrc?: string; font?: string } = {},
): Promise<HTMLCanvasElement> {
  const size = Math.min(art.width, art.height);
  const L = frameLayout(size);
  const out = document.createElement("canvas");
  out.width = L.width;
  out.height = L.height;
  const ctx = out.getContext("2d");
  if (!ctx) return art;

  // 紙底
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, L.width, L.height);

  // 白色卡紙（含淡影）＋作品
  ctx.save();
  ctx.shadowColor = "rgba(90, 58, 30, 0.14)";
  ctx.shadowBlur = Math.round(L.pad * 0.5);
  ctx.shadowOffsetY = Math.round(L.pad * 0.15);
  roundRect(ctx, L.art.x, L.art.y, L.art.size, L.art.size, L.radius);
  ctx.fillStyle = MAT;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, L.art.x, L.art.y, L.art.size, L.art.size, L.radius);
  ctx.clip();
  ctx.drawImage(art, 0, 0, size, size, L.art.x, L.art.y, L.art.size, L.art.size);
  ctx.restore();

  // 底部品牌列：細分隔線、站名、網址
  ctx.strokeStyle = LINE;
  ctx.lineWidth = Math.max(2, Math.round(size * 0.003));
  ctx.beginPath();
  ctx.moveTo(L.pad, L.footer.y);
  ctx.lineTo(L.width - L.pad, L.footer.y);
  ctx.stroke();

  const font = options.font ?? "'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `900 ${L.text.nameSize}px ${font}`;
  ctx.fillText(FRAME_SITE_NAME, L.text.x, L.text.nameY);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 ${L.text.urlSize}px ${font}`;
  ctx.fillText(FRAME_SITE_URL, L.text.x, L.text.urlY);

  const mascot = options.mascotSrc ? await loadImage(options.mascotSrc) : null;
  if (mascot) {
    ctx.drawImage(mascot, L.mascot.x, L.mascot.y, L.mascot.width, L.mascot.height);
  }
  return out;
}
