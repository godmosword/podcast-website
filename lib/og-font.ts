import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** @vercel/og（Satori）內嵌字型名稱；須與 ImageResponse fonts[].name 一致。 */
export const OG_FONT_FAMILY = "Noto Sans TC";

/** 站內 OG 圖共用 TTF（@vercel/og 不支援 woff2）。靜態路徑避免 public/ trace 膨脹。 */
const FONT_PATH = join(process.cwd(), "app/fonts/noto-sans-tc-og.ttf");

let cachedFont: ArrayBuffer | null = null;

/** 從 repo 讀取 Noto Sans TC，build 期間不對外 fetch。 */
export async function loadOgFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  const buf = await readFile(FONT_PATH);
  cachedFont = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  );
  return cachedFont;
}

type OgFontEntry = {
  name: string;
  data: ArrayBuffer;
  style: "normal";
  weight: 400 | 700;
};

/** ImageResponse fonts 選項（400／700 共用同一 TTF，與 story-og 既有做法一致）。 */
export function ogFontOptions(fontData: ArrayBuffer): OgFontEntry[] {
  return [
    {
      name: OG_FONT_FAMILY,
      data: fontData,
      style: "normal",
      weight: 400,
    },
    {
      name: OG_FONT_FAMILY,
      data: fontData,
      style: "normal",
      weight: 700,
    },
  ];
}
