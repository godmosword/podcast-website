/** 將彩色 JPG 轉成兒童著色用黑線白底 PNG。 */
import sharp from "sharp";
import { LINE_LUMA_WALL } from "@/lib/coloring/tools";

export const COLORING_LINEART_MAX_SIDE = 1024;

/** 外框可填／全部可填上限（過高＝主體輪廓未與邊框隔開）。 */
export const COLORING_BUCKET_LEAK_MAX = 0.88;

/** despeckle：黑色連通區面積小於此值視為噪點候選。 */
export const SPECKLE_MIN_AREA = 40;

/** despeckle：噪點候選的 bounding box 長邊上限（防誤刪細長真線）。 */
export const SPECKLE_MAX_DIM = 12;

/** 非純黑白（luma 中間帶）像素占比上限（與 runtime LINE_LUMA_WALL 同語義的雙峰契約）。 */
export const COLORING_MIDTONE_RATIO_MAX = 0.002;

/**
 * 依頁面種類的品質 gate。
 * leakMax 抓「真開放輪廓」（外框灌進主體時比值趨近 1）；乾淨線稿背景開闊，
 * 外框佔可填比 0.4–0.65 屬正常，故門檻設 0.8，另以 interiorMinRatio
 * （主體內部可填區占全圖比下限）防「全開放／全白」假線稿。
 */
export const COLORING_GATES = {
  character: { leakMax: 0.8, inkCoverageMax: 0.25, speckleCountMax: 40, interiorMinRatio: 0.05 },
  scene: { leakMax: 0.8, inkCoverageMax: 0.4, speckleCountMax: 80, interiorMinRatio: 0.05 },
} as const;

export type ColoringGateKind = keyof typeof COLORING_GATES;

/**
 * 構圖相似度（edge IoU）：線稿墨線 vs 參考彩圖 Laplacian 邊緣。
 * scene 硬擋、character 僅 warn；未傳 referenceBuffer 時不跑（相容現役資產契約）。
 * 門檻依現行 AI 簡化場景（edgeIou≈0.08–0.15）與演算法忠實線稿（≈0.18+）校準。
 */
export const COLORING_FIDELITY = {
  sampleSize: 64,
  scene: { minEdgeIou: 0.16 },
  character: { warnEdgeIou: 0.13 },
} as const;

export type CompositionFidelity = {
  /** 線稿墨線（經輕微膨脹）與參考邊緣的 IoU，0–1。 */
  edgeIou: number;
};

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

type InkComponent = {
  area: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  pixels: number[];
};

/** 8 鄰域標記黑色連通區（bin：1 = 黑）。 */
export function labelInkComponents(
  bin: Uint8Array,
  width: number,
  height: number,
): InkComponent[] {
  const visited = new Uint8Array(bin.length);
  const components: InkComponent[] = [];
  const stack: number[] = [];

  for (let start = 0; start < bin.length; start += 1) {
    if (!bin[start] || visited[start]) continue;
    visited[start] = 1;
    stack.push(start);
    const comp: InkComponent = {
      area: 0,
      minX: width,
      minY: height,
      maxX: 0,
      maxY: 0,
      pixels: [],
    };
    while (stack.length > 0) {
      const idx = stack.pop()!;
      const x = idx % width;
      const y = (idx - x) / width;
      comp.area += 1;
      comp.pixels.push(idx);
      if (x < comp.minX) comp.minX = x;
      if (x > comp.maxX) comp.maxX = x;
      if (y < comp.minY) comp.minY = y;
      if (y > comp.maxY) comp.maxY = y;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nidx = ny * width + nx;
          if (!bin[nidx] || visited[nidx]) continue;
          visited[nidx] = 1;
          stack.push(nidx);
        }
      }
    }
    components.push(comp);
  }
  return components;
}

/**
 * 移除小面積且短小（非細長線段）的黑色連通區；回傳新陣列不改輸入。
 * 應在與主體外輪廓 merge **之前** 對 Laplacian edgeBin 做（輪廓天然豁免）。
 */
export function despeckleInk(
  bin: Uint8Array,
  width: number,
  height: number,
  minArea = SPECKLE_MIN_AREA,
  maxDim = SPECKLE_MAX_DIM,
): Uint8Array {
  const out = Uint8Array.from(bin);
  for (const comp of labelInkComponents(bin, width, height)) {
    if (comp.area >= minArea) continue;
    const dim = Math.max(comp.maxX - comp.minX + 1, comp.maxY - comp.minY + 1);
    if (dim > maxDim) continue;
    for (const idx of comp.pixels) out[idx] = 0;
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

export type LineArtOptions = {
  maxSide?: number;
  /** sharp median 視窗（奇數）；抹平黏土顆粒質感。 */
  medianSize?: number;
  /** Laplacian 後二值化門檻（越高黑越少）。 */
  edgeThreshold?: number;
  speckleMinArea?: number;
  speckleMaxDim?: number;
};

/**
 * 灰階 median → Laplacian → threshold → despeckle → ∪ 主體外輪廓 → morph close → 加粗。
 * 輸出白底黑線 PNG buffer。管線順序固定（despeckle 在 merge outline 前，輪廓天然豁免）。
 */
export async function convertToLineArt(
  input: Buffer | string,
  options: LineArtOptions = {},
): Promise<LineArtResult> {
  const {
    maxSide = COLORING_LINEART_MAX_SIDE,
    medianSize = 3,
    edgeThreshold = 200,
    speckleMinArea = SPECKLE_MIN_AREA,
    speckleMaxDim = SPECKLE_MAX_DIM,
  } = options;

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
    .median(medianSize)
    .normalise()
    .blur(0.8)
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    })
    .negate()
    .threshold(edgeThreshold)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rawEdgeBin = new Uint8Array(width * height);
  for (let i = 0; i < rawEdgeBin.length; i += 1) {
    rawEdgeBin[i] = (edges.data[i] ?? 255) < 128 ? 1 : 0;
  }
  const edgeBin = despeckleInk(rawEdgeBin, width, height, speckleMinArea, speckleMaxDim);

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

export type LineArtQuality = {
  width: number;
  height: number;
  /** 無 alpha 或 alpha 全 255（runtime multiply 合成契約）。 */
  opaque: boolean;
  /** 黑像素占比（luma < LINE_LUMA_WALL）。 */
  inkCoverage: number;
  /** 非純黑白中間帶占比（luma ∈ [32, 224)；雙峰契約應 ≈ 0）。 */
  midToneRatio: number;
  /** 面積 < SPECKLE_MIN_AREA 的黑色連通區數（噪點指標）。 */
  speckleCount: number;
  /** 外框可填／全部可填（見 estimateBucketLeakRatio）。 */
  exteriorLeakRatio: number;
  /** 主體內部可填像素占全圖比（過低＝輪廓全開放或全白假線稿）。 */
  interiorFillRatio: number;
  /** 主體內部最大可填區占內部可填總量（內輪廓全開放時趨近 1；僅回報不硬擋）。 */
  largestInteriorFillRatio: number;
};

/** 對線稿 PNG 一次量測所有品質指標（與 runtime LINE_LUMA_WALL 同語義）。 */
export async function measureLineArtQuality(pngBuffer: Buffer): Promise<LineArtQuality> {
  const meta = await sharp(pngBuffer).metadata();
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let opaque = true;
  let ink = 0;
  let midTone = 0;
  const inkBin = new Uint8Array(width * height);
  for (let idx = 0, p = 0; idx < width * height; idx += 1, p += channels) {
    if (meta.hasAlpha && (data[p + 3] ?? 255) < 255) opaque = false;
    const luma = lumaOf(data[p] ?? 0, data[p + 1] ?? 0, data[p + 2] ?? 0);
    if (luma < LINE_LUMA_WALL) {
      ink += 1;
      inkBin[idx] = 1;
    }
    if (luma >= 32 && luma < 224) midTone += 1;
  }

  let speckleCount = 0;
  for (const comp of labelInkComponents(inkBin, width, height)) {
    if (comp.area < SPECKLE_MIN_AREA) speckleCount += 1;
  }

  const exterior = markExteriorFill(data, width, height, channels);
  let fillable = 0;
  let exteriorFillable = 0;
  const interiorBin = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isFillable(data, width, channels, x, y)) continue;
      fillable += 1;
      const idx = y * width + x;
      if (exterior[idx]) exteriorFillable += 1;
      else interiorBin[idx] = 1;
    }
  }

  let interiorTotal = 0;
  let interiorLargest = 0;
  for (const comp of labelInkComponents(interiorBin, width, height)) {
    interiorTotal += comp.area;
    if (comp.area > interiorLargest) interiorLargest = comp.area;
  }

  const total = width * height;
  return {
    width,
    height,
    opaque,
    inkCoverage: total === 0 ? 0 : ink / total,
    midToneRatio: total === 0 ? 0 : midTone / total,
    speckleCount,
    exteriorLeakRatio: fillable === 0 ? 1 : exteriorFillable / fillable,
    interiorFillRatio: total === 0 ? 0 : interiorTotal / total,
    largestInteriorFillRatio: interiorTotal === 0 ? 0 : interiorLargest / interiorTotal,
  };
}

/** AI 原稿殘灰清除門檻（luma ≥ 此值 → 白）；淺灰陰影歸白、深線歸黑。 */
export const AI_LINE_THRESHOLD = 150;

/**
 * AI 生成原稿 → 純黑白閉合線稿：壓平透明、統一 1024 方圖（白邊 pad）、
 * 去殘灰、morph close＋加粗。與 illustrate 的 toStandardJpeg 無關（勿混用）。
 */
export async function postprocessAiLineArt(raw: Buffer): Promise<Buffer> {
  const squared = await sharp(raw)
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .resize(COLORING_LINEART_MAX_SIDE, COLORING_LINEART_MAX_SIDE, {
      fit: "contain",
      background: "#ffffff",
    })
    .greyscale()
    .threshold(AI_LINE_THRESHOLD)
    .png()
    .toBuffer();
  const closed = await closeAndThickenLineArt(squared);
  return closed.buffer;
}

export type LineArtGateOptions = {
  /** 原彩／參考圖；提供時才跑構圖相似度。 */
  referenceBuffer?: Buffer;
};

export type LineArtGateResult = {
  ok: boolean;
  problems: string[];
  warnings: string[];
  quality: LineArtQuality;
  /** 有傳 referenceBuffer 時才有值（= edgeIou）。 */
  compositionScore?: number;
};

/**
 * 量測線稿相對參考彩圖的構圖相似度（downsample → 參考 Laplacian 邊緣 vs 線稿墨線 IoU）。
 * 語意級「換成太陽雲場」仍靠 prompt＋人工清單；此分數擋明顯錯位／空洞構圖。
 */
export async function measureCompositionFidelity(
  linePng: Buffer,
  referenceImage: Buffer,
): Promise<CompositionFidelity> {
  const size = COLORING_FIDELITY.sampleSize;
  const resizeOpts = {
    fit: "contain" as const,
    background: "#ffffff",
  };
  const { data: refData } = await sharp(referenceImage)
    .resize(size, size, resizeOpts)
    .greyscale()
    .blur(0.6)
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: lineData } = await sharp(linePng)
    .resize(size, size, resizeOpts)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const n = size * size;
  const refEdge = new Uint8Array(n);
  const lineInk = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    refEdge[i] = (refData[i] ?? 0) > 40 ? 1 : 0;
    lineInk[i] = (lineData[i] ?? 255) < LINE_LUMA_WALL ? 1 : 0;
  }

  // 輕微膨脹線稿，容忍描邊對齊誤差
  const dilated = new Uint8Array(n);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let black = 0;
      for (let dy = -1; dy <= 1 && !black; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          if (lineInk[ny * size + nx]) {
            black = 1;
            break;
          }
        }
      }
      dilated[y * size + x] = black;
    }
  }

  let inter = 0;
  let uni = 0;
  for (let i = 0; i < n; i += 1) {
    const a = refEdge[i] ?? 0;
    const b = dilated[i] ?? 0;
    if (a | b) uni += 1;
    if (a & b) inter += 1;
  }

  return { edgeIou: uni === 0 ? 0 : inter / uni };
}

/** 依頁面種類跑完整品質 gate（白底＋不透明＋雙峰＋覆蓋率＋噪點＋漏色［＋可選構圖］）。 */
export async function evaluateLineArtGate(
  pngBuffer: Buffer,
  kind: ColoringGateKind,
  options: LineArtGateOptions = {},
): Promise<LineArtGateResult> {
  const gate = COLORING_GATES[kind];
  const problems: string[] = [];
  const warnings: string[] = [];

  if (!(await isMostlyWhiteBackground(pngBuffer))) problems.push("背景不夠白");

  const quality = await measureLineArtQuality(pngBuffer);
  if (
    quality.width > COLORING_LINEART_MAX_SIDE ||
    quality.height > COLORING_LINEART_MAX_SIDE
  ) {
    problems.push(`尺寸超過 ${COLORING_LINEART_MAX_SIDE}`);
  }
  if (!quality.opaque) problems.push("含透明像素");
  if (quality.midToneRatio > COLORING_MIDTONE_RATIO_MAX) {
    problems.push(
      `中間灰帶 ${(quality.midToneRatio * 100).toFixed(2)}% 超標（非雙峰黑白）`,
    );
  }
  if (quality.inkCoverage > gate.inkCoverageMax) {
    problems.push(
      `黑覆蓋率 ${(quality.inkCoverage * 100).toFixed(1)}% > ${gate.inkCoverageMax * 100}%`,
    );
  }
  if (quality.speckleCount > gate.speckleCountMax) {
    problems.push(`噪點連通區 ${quality.speckleCount} > ${gate.speckleCountMax}`);
  }
  if (quality.exteriorLeakRatio >= gate.leakMax) {
    problems.push(
      `外框可填比 ${quality.exteriorLeakRatio.toFixed(3)} ≥ ${gate.leakMax}（輪廓未閉合）`,
    );
  }
  if (quality.interiorFillRatio < gate.interiorMinRatio) {
    problems.push(
      `內部可填占比 ${(quality.interiorFillRatio * 100).toFixed(1)}% < ${gate.interiorMinRatio * 100}%（輪廓全開放或近全白）`,
    );
  }

  let compositionScore: number | undefined;
  if (options.referenceBuffer) {
    const fidelity = await measureCompositionFidelity(pngBuffer, options.referenceBuffer);
    compositionScore = fidelity.edgeIou;
    const scoreText = `構圖相似度 edgeIou=${fidelity.edgeIou.toFixed(3)}`;
    if (kind === "scene" && fidelity.edgeIou < COLORING_FIDELITY.scene.minEdgeIou) {
      problems.push(
        `${scoreText} < ${COLORING_FIDELITY.scene.minEdgeIou}（與參考構圖落差過大）`,
      );
    } else if (
      kind === "character" &&
      fidelity.edgeIou < COLORING_FIDELITY.character.warnEdgeIou
    ) {
      warnings.push(
        `${scoreText} < ${COLORING_FIDELITY.character.warnEdgeIou}（建議對照原圖確認大型道具）`,
      );
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    warnings,
    quality,
    compositionScore,
  };
}

/** 摘要一行品質數據（log 用）。 */
export function formatLineArtQuality(q: LineArtQuality): string {
  return (
    `ink=${(q.inkCoverage * 100).toFixed(1)}% speckles=${q.speckleCount} ` +
    `leak=${q.exteriorLeakRatio.toFixed(3)} interiorFill=${(q.interiorFillRatio * 100).toFixed(0)}% ` +
    `interiorMax=${q.largestInteriorFillRatio.toFixed(2)}`
  );
}
