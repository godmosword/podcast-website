/** 將彩色 JPG 轉成兒童著色用黑線白底 PNG。 */
import sharp from "sharp";
import { LINE_LUMA_WALL } from "@/lib/coloring/tools";

export const COLORING_LINEART_MAX_SIDE = 1024;

/** 外框可填／全部可填上限（過高＝主體輪廓未與邊框隔開）。 */
export const COLORING_BUCKET_LEAK_MAX = 0.88;

/** morph close 半徑（px）：封小於約 2r 的缺口。 */
const MORPH_CLOSE_RADIUS = 3;

/** 自邊框長出背景時的顏色距離容許（對種子色固定比對，避免漸層滲入主體）。 */
const BG_COLOR_TOL = 28;

export type LineArtResult = {
  width: number;
  height: number;
  buffer: Buffer;
};

function lumaOf(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function colorDist2(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

/** bin：1 = 黑線，0 = 白底。 */
function dilateBlack(bin: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(bin.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let black = 0;
      for (let dy = -1; dy <= 1 && !black; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (bin[ny * width + nx]) {
            black = 1;
            break;
          }
        }
      }
      out[y * width + x] = black;
    }
  }
  return out;
}

function erodeBlack(bin: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(bin.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let black = 1;
      for (let dy = -1; dy <= 1 && black; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            black = 0;
            break;
          }
          if (!bin[ny * width + nx]) {
            black = 0;
            break;
          }
        }
      }
      out[y * width + x] = black;
    }
  }
  return out;
}

/**
 * 自邊框以「種子色」固定容差長出背景（不沿漸層滲入主體），
 * 主體邊緣轉成閉合黑線（補 Laplacian 稀疏缺口）。
 */
export function subjectOutlineFromRgba(
  data: Buffer | Uint8Array,
  width: number,
  height: number,
  channels: number,
  colorTol = BG_COLOR_TOL,
): Uint8Array {
  const tol2 = colorTol * colorTol;
  const isBg = new Uint8Array(width * height);
  /** 每個背景像素對應的種子色索引；stack 帶 seedR/G/B。 */
  const stack: number[] = [];

  const trySeed = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (isBg[idx]) return;
    const i = idx * channels;
    isBg[idx] = 1;
    stack.push(x, y, data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0);
  };

  for (let x = 0; x < width; x += 1) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  while (stack.length > 0) {
    const seedB = stack.pop()!;
    const seedG = stack.pop()!;
    const seedR = stack.pop()!;
    const y = stack.pop()!;
    const x = stack.pop()!;
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as const;
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nidx = ny * width + nx;
      if (isBg[nidx]) continue;
      const ni = nidx * channels;
      if (
        colorDist2(
          seedR,
          seedG,
          seedB,
          data[ni] ?? 0,
          data[ni + 1] ?? 0,
          data[ni + 2] ?? 0,
        ) <= tol2
      ) {
        isBg[nidx] = 1;
        stack.push(nx, ny, seedR, seedG, seedB);
      }
    }
  }

  // 主體 = 非背景；輪廓 = 主體且鄰接背景
  const outline = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;
      if (isBg[idx]) continue;
      if (
        isBg[idx - 1] ||
        isBg[idx + 1] ||
        isBg[idx - width] ||
        isBg[idx + width]
      ) {
        outline[idx] = 1;
      }
    }
  }
  return dilateBlack(dilateBlack(outline, width, height), width, height);
}

/**
 * 對黑線做 morph close（dilate→erode）封小缺口，再額外 dilate 一次加粗。
 * 輸入／輸出皆為白底黑線 PNG buffer。
 */
export async function closeAndThickenLineArt(
  pngOrRaw: Buffer,
  radius = MORPH_CLOSE_RADIUS,
): Promise<{ width: number; height: number; buffer: Buffer }> {
  const { data, info } = await sharp(pngOrRaw)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let cur = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < cur.length; i += 1, p += channels) {
    cur[i] = (data[p] ?? 255) < 128 ? 1 : 0;
  }

  for (let i = 0; i < radius; i += 1) {
    cur = dilateBlack(cur, width, height);
  }
  for (let i = 0; i < radius; i += 1) {
    cur = erodeBlack(cur, width, height);
  }
  cur = dilateBlack(cur, width, height);

  const margin = 3;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x < margin || y < margin || x >= width - margin || y >= height - margin) {
        cur[y * width + x] = 0;
      }
    }
  }

  const out = Buffer.alloc(width * height);
  for (let i = 0; i < cur.length; i += 1) {
    out[i] = cur[i] ? 0 : 255;
  }

  const buffer = await sharp(out, {
    raw: { width, height, channels: 1 },
  })
    .png()
    .toBuffer();

  return { width, height, buffer };
}

/**
 * 灰階 Laplacian 線稿 ∪ 主體外輪廓 → morph close → 加粗。
 * 輸出白底黑線 PNG buffer。
 */
export async function convertToLineArt(
  input: Buffer | string,
  maxSide = COLORING_LINEART_MAX_SIDE,
): Promise<LineArtResult> {
  const resized = sharp(input).rotate().resize({
    width: maxSide,
    height: maxSide,
    fit: "inside",
    withoutEnlargement: true,
  });

  const rgba = await resized
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = rgba.info;

  const edges = await sharp(input)
    .rotate()
    .resize({
      width: maxSide,
      height: maxSide,
      fit: "inside",
      withoutEnlargement: true,
    })
    .greyscale()
    .normalise()
    .blur(0.8)
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    })
    .negate()
    .threshold(200)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const edgeBin = new Uint8Array(width * height);
  for (let i = 0; i < edgeBin.length; i += 1) {
    edgeBin[i] = (edges.data[i] ?? 255) < 128 ? 1 : 0;
  }

  const outline = subjectOutlineFromRgba(rgba.data, width, height, channels);
  const merged = new Uint8Array(width * height);
  for (let i = 0; i < merged.length; i += 1) {
    merged[i] = edgeBin[i] || outline[i] ? 1 : 0;
  }

  const mergedGray = Buffer.alloc(width * height);
  for (let i = 0; i < merged.length; i += 1) {
    mergedGray[i] = merged[i] ? 0 : 255;
  }

  const mergedPng = await sharp(mergedGray, {
    raw: { width, height, channels: 1 },
  })
    .blur(0.7)
    .threshold(235)
    .png()
    .toBuffer();

  const closed = await closeAndThickenLineArt(mergedPng);

  return {
    width: closed.width,
    height: closed.height,
    buffer: closed.buffer,
  };
}

/** 抽樣檢查：四角與中心偏白（線稿背景應為白）。 */
export async function isMostlyWhiteBackground(
  pngBuffer: Buffer,
  sampleSize = 8,
): Promise<boolean> {
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const points = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
    [Math.floor(width / 2), Math.floor(height / 2)],
  ] as const;

  let whiteish = 0;
  for (const [x, y] of points) {
    const i = (y * width + x) * channels;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const avg = (r + g + b) / 3;
    if (avg >= 200) whiteish += 1;
  }

  void sampleSize;
  return whiteish >= 4;
}

function isFillable(
  data: Uint8ClampedArray | Buffer,
  width: number,
  channels: number,
  x: number,
  y: number,
): boolean {
  const i = (y * width + x) * channels;
  return lumaOf(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0) >= LINE_LUMA_WALL;
}

/** 自四角長出外框白底（邊框可填區）。 */
function markExteriorFill(
  data: Uint8ClampedArray | Buffer,
  width: number,
  height: number,
  channels: number,
): Uint8Array {
  const exterior = new Uint8Array(width * height);
  const stack: number[] = [];
  const seeds = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ] as const;
  for (const [x, y] of seeds) {
    if (!isFillable(data, width, channels, x, y)) continue;
    const idx = y * width + x;
    if (exterior[idx]) continue;
    exterior[idx] = 1;
    stack.push(x, y);
  }
  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as const;
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nidx = ny * width + nx;
      if (exterior[nidx]) continue;
      if (!isFillable(data, width, channels, nx, ny)) continue;
      exterior[nidx] = 1;
      stack.push(nx, ny);
    }
  }
  return exterior;
}

/**
 * 量測輪廓閉合度：外框可填像素／全部可填像素。
 * 破洞時外框洪水灌進主體 → 比值接近 1；閉合時主體內部留白 → 比值明顯較低。
 */
export async function estimateBucketLeakRatio(pngBuffer: Buffer): Promise<number> {
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const exterior = markExteriorFill(data, width, height, channels);

  let fillable = 0;
  let exteriorFillable = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isFillable(data, width, channels, x, y)) continue;
      fillable += 1;
      if (exterior[y * width + x]) exteriorFillable += 1;
    }
  }

  if (fillable === 0) return 1;
  return exteriorFillable / fillable;
}
