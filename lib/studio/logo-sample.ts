import {
  contrastRatio,
  hueDistance,
  silhouetteGate,
} from "@/lib/character-logo-contrast";
import { parseHexColor } from "@/data/character-logos";

export type SampledPrimaryCompare = {
  intended: string;
  sampled: string;
  hueDist: number;
  silhouette: number;
  gate: number;
};

function toHex(channel: number): string {
  return Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function colorDistance(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** 量化到 16 階，壓噪點。 */
function quantize(channel: number): number {
  return Math.min(255, Math.round(channel / 16) * 16);
}

/**
 * 從產出圖取樣主色：丟掉接近家族底的像素，剩下面積最大的色當剪影主色。
 */
export async function samplePrimaryHex(
  image: Buffer,
  familyBg: string,
): Promise<string | null> {
  const { default: sharp } = await import("sharp");
  const bg = parseHexColor(familyBg);
  const { data, info } = await sharp(image)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const counts = new Map<string, { count: number; r: number; g: number; b: number }>();
  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (colorDistance([r, g, b], bg) < 36) continue;
    const qr = quantize(r);
    const qg = quantize(g);
    const qb = quantize(b);
    const key = `${qr},${qg},${qb}`;
    const current = counts.get(key);
    if (current) {
      current.count += 1;
      current.r += r;
      current.g += g;
      current.b += b;
    } else {
      counts.set(key, { count: 1, r, g, b });
    }
  }
  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  if (!best) return null;
  return rgbToHex(best.r / best.count, best.g / best.count, best.b / best.count);
}

export function compareSampledPrimary(
  sampled: string,
  intended: string,
  familyBg: string,
): SampledPrimaryCompare {
  const hueDist = hueDistance(sampled, intended);
  const silhouette = contrastRatio(sampled, familyBg);
  const gate = silhouetteGate(hueDistance(sampled, familyBg));
  return { intended, sampled, hueDist, silhouette, gate };
}
