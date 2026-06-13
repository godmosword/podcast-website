/**
 * Apple Podcast 封面下載與正規化。
 * 以 fit: contain 縮放至方圖，避免裁切；與全幕生圖的 fit: cover 區分。
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const COVER_TARGET_PX = 1400;
const COVER_DOWNLOAD_TIMEOUT_MS = 60_000;
const MAX_COVER_BYTES = 10 * 1024 * 1024;

/** 將任意比例封面縮放至方圖，完整保留內容（白底 letterbox）。 */
export async function normalizeCoverImage(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .resize(COVER_TARGET_PX, COVER_TARGET_PX, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .jpeg({ quality: 88 })
    .toBuffer();
}

/** 從 URL 下載 Apple 封面，正規化後寫入 dest（01.jpg）。 */
export async function downloadAndSaveCover(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(COVER_DOWNLOAD_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Cover download failed ${res.status}: ${url}`);
  }
  const len = res.headers.get("content-length");
  if (len && parseInt(len, 10) > MAX_COVER_BYTES) {
    throw new Error(`Cover too large (${len} bytes): ${url}`);
  }
  const raw = Buffer.from(await res.arrayBuffer());
  if (raw.length > MAX_COVER_BYTES) {
    throw new Error(`Cover too large (${raw.length} bytes): ${url}`);
  }
  const normalized = await normalizeCoverImage(raw);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, normalized);
}
