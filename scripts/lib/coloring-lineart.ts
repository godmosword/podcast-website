/** 將彩色 JPG 轉成兒童著色用黑線白底 PNG。 */
import sharp from "sharp";

export const COLORING_LINEART_MAX_SIDE = 1024;

export type LineArtResult = {
  width: number;
  height: number;
  buffer: Buffer;
};

/**
 * 灰階 → 輕模糊 → Laplacian 邊緣 → 反相二值化 → 輕微加粗線條。
 * 輸出白底黑線 PNG buffer。
 */
export async function convertToLineArt(
  input: Buffer | string,
  maxSide = COLORING_LINEART_MAX_SIDE,
): Promise<LineArtResult> {
  const base = sharp(input).rotate().resize({
    width: maxSide,
    height: maxSide,
    fit: "inside",
    withoutEnlargement: true,
  });

  const edges = await base
    .clone()
    .greyscale()
    .normalise()
    .blur(0.8)
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    })
    .negate()
    .threshold(210)
    .toBuffer();

  // 再輕模糊 + 二值，讓線條略粗、好填色
  const thickened = await sharp(edges)
    .blur(0.6)
    .threshold(240)
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    width: thickened.info.width,
    height: thickened.info.height,
    buffer: thickened.data,
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
    // 中心可能落在線條上，只嚴格檢查四角
    const avg = (r + g + b) / 3;
    if (avg >= 200) whiteish += 1;
  }

  // 至少四角偏白（允許中心是線）
  void sampleSize;
  return whiteish >= 4;
}
