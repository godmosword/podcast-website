/**
 * roamer sprite 去背：從邊界 flood-fill 只移除「與邊界相連的近白／淺灰背景」，
 * 保留內部白（牙齒、眼白、賽車白條、白色數字圈），邊界 1px 羽化消除白暈。
 *
 * 用途：圖像模型偶爾回傳近白底而非約定的 magenta 平背，magenta chroma-key 抓不到 →
 * 整張殘留不透明白框。此函式作為去背保險絲（standalone fix + 生成管線 postProcess 共用）。
 */
import sharp from "sharp";

/** 近白／淺灰背景判定：各通道夠亮且低飽和（避免抓到彩色黏土）。 */
const BG_MIN = 225;
const BG_SAT = 20;
/** 羽化帶：保留但偏白的邊界像素依亮度部分透明。 */
const FEATHER_MIN = 205;

function isBgLike(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return min >= BG_MIN && max - min <= BG_SAT;
}

export type FloodResult = { removed: Uint8Array; bgPct: number };

/** 背景像素判定函式（RGB → 是否為背景）。 */
export type BgPredicate = (r: number, g: number, b: number) => boolean;

/**
 * 從四邊 flood-fill（可穿越已透明 rim）標記與邊界相連的背景像素。
 * @param isBg 自訂背景判定；預設近白／淺灰（roamer 用），forest magenta 殘留等場景可換 predicate。
 */
export function floodBorderBackground(
  data: Buffer | Uint8Array,
  w: number,
  h: number,
  c: number,
  isBg: BgPredicate = isBgLike,
): FloodResult {
  const removed = new Uint8Array(w * h);
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (seen[p]) return;
    const i = p * c;
    const transparent = data[i + 3]! < 16;
    const bg = isBg(data[i]!, data[i + 1]!, data[i + 2]!);
    if (!transparent && !bg) return;
    seen[p] = 1;
    if (bg) removed[p] = 1;
    stack.push(x, y);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  let count = 0;
  for (let p = 0; p < removed.length; p++) if (removed[p]) count++;
  return { removed, bgPct: (100 * count) / (w * h) };
}

/** 套用去背＋邊界羽化到 raw RGBA（就地修改 data）。 */
export function applyBackgroundRemoval(
  data: Buffer | Uint8Array,
  w: number,
  h: number,
  c: number,
  removed: Uint8Array,
): void {
  for (let p = 0; p < w * h; p++) {
    const i = p * c;
    if (removed[p]) {
      data[i + 3] = 0;
      continue;
    }
    const min = Math.min(data[i]!, data[i + 1]!, data[i + 2]!);
    if (min < FEATHER_MIN) continue;
    const x = p % w;
    const y = (p / w) | 0;
    const touchesBg =
      (x > 0 && removed[p - 1]) ||
      (x < w - 1 && removed[p + 1]) ||
      (y > 0 && removed[p - w]) ||
      (y < h - 1 && removed[p + w]);
    if (touchesBg) {
      const t = (min - FEATHER_MIN) / (255 - FEATHER_MIN);
      data[i + 3] = Math.round(data[i + 3]! * (1 - 0.85 * t));
    }
  }
}

/** 去除與邊界相連的近白背景，保留原畫框。回傳 PNG buffer 與背景占比。 */
export async function removeBorderBackground(
  buf: Buffer,
): Promise<{ png: Buffer; bgPct: number }> {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const { removed, bgPct } = floodBorderBackground(data, w, h, c);
  applyBackgroundRemoval(data, w, h, c, removed);
  const png = await sharp(data, { raw: { width: w, height: h, channels: c } })
    .png()
    .toBuffer();
  return { png, bgPct };
}
