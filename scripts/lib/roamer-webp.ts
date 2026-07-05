import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const ROAMER_WEBP_QUALITY = 82;

export function pngPathToWebpPath(pngPath: string): string {
  return pngPath.replace(/\.png$/i, ".webp");
}

export async function pngBufferToWebp(
  buf: Buffer,
  quality = ROAMER_WEBP_QUALITY,
): Promise<Buffer> {
  return sharp(buf).webp({ quality, effort: 4 }).toBuffer();
}

export async function writeWebpSibling(pngPath: string): Promise<string> {
  const webpPath = pngPathToWebpPath(pngPath);
  const png = readFileSync(pngPath);
  const webp = await pngBufferToWebp(png);
  writeFileSync(webpPath, webp);
  return webpPath;
}
