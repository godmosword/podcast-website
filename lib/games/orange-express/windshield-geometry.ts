/**
 * 前窗的投影與畫圖小工具（windshield.ts 與沿途事件共用）。只有幾何，不知道站、場景或狀態。
 * 世界座標：x 往右、y 往上、z 往前（公尺），鏡頭在 x = 0、y = EYE。
 */

export const Z_NEAR = 2;
export const Z_FAR = 220;
export const EYE = 1.6;

export type View = { w: number; h: number; vx: number; hy: number; f: number };

/** 前窗的投影：消失點在中間、地平線在四成二高。 */
export function viewFor(width: number, height: number): View {
  return { w: width, h: height, vx: width * 0.5, hy: height * 0.42, f: (height * 0.58 * Z_NEAR) / EYE };
}

export type Pt = { x: number; y: number };

export function project(view: View, x: number, y: number, z: number): Pt {
  const s = view.f / z;
  return { x: view.vx + x * s, y: view.hy + (EYE - y) * s };
}

export function poly(ctx: CanvasRenderingContext2D, pts: readonly Pt[], color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
}

/** 水平面（地面、月台頂、車頂）。 */
export function quad(
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
export function wall(
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
export function face(
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

export function line(
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

export function segment(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

export function widthAt(view: View, z: number, meters: number, min = 1): number {
  return Math.max(min, (view.f / z) * meters);
}

/** 世界裡每隔 gap 公尺重複的東西，回傳這一幀看得到的 z（由遠到近）。 */
export function repeats(travel: number, gap: number, near: number, far: number): number[] {
  const offset = ((travel % gap) + gap) % gap;
  const out: number[] = [];
  for (let z = gap - offset; z < far; z += gap) {
    if (z > near) out.push(z);
  }
  return out.reverse();
}

/** 用世界位置挑一個穩定的小變化（建築高度、顏色）。 */
export function hashAt(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
