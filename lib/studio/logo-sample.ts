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

/** 量化 bucket 的累計值。 */
type Bucket = { count: number; r: number; g: number; b: number };

/** 相鄰 bucket 的最小佔比（相對於眾數 bucket）；擋掉區塊交界的反鋸齒橋接。 */
const NEIGHBOUR_MIN_RATIO = 0.05;

function bucketKey(r: number, g: number, b: number): string {
  return `${r},${g},${b}`;
}

/**
 * 從眾數 bucket 沿 26 鄰域長出同一個色塊。
 *
 * 連續漸層會把單一色塊打散成一條相鄰的 bucket 稜線；只取眾數會拿到其中一段切片，
 * 而不是色塊真實均值。反鋸齒交界的 bucket 像素量遠低於色塊本體，用佔比門檻擋掉，
 * 避免把相鄰色塊（例如擋風玻璃或嘴）併進來。
 */
function growRegion(
  counts: ReadonlyMap<string, Bucket>,
  seedKey: string,
  seed: Bucket,
): Bucket {
  const minCount = seed.count * NEIGHBOUR_MIN_RATIO;
  const visited = new Set<string>([seedKey]);
  const queue: string[] = [seedKey];
  const total: Bucket = { count: 0, r: 0, g: 0, b: 0 };

  while (queue.length > 0) {
    const key = queue.pop()!;
    const bucket = counts.get(key);
    if (!bucket) continue;
    total.count += bucket.count;
    total.r += bucket.r;
    total.g += bucket.g;
    total.b += bucket.b;

    const [qr, qg, qb] = key.split(",").map(Number) as [number, number, number];
    for (const dr of [-16, 0, 16]) {
      for (const dg of [-16, 0, 16]) {
        for (const db of [-16, 0, 16]) {
          if (dr === 0 && dg === 0 && db === 0) continue;
          const next = bucketKey(qr + dr, qg + dg, qb + db);
          if (visited.has(next)) continue;
          const neighbour = counts.get(next);
          if (!neighbour || neighbour.count < minCount) continue;
          visited.add(next);
          queue.push(next);
        }
      }
    }
  }

  return total;
}

/**
 * 從產出圖取樣主色：丟掉接近家族底的像素，剩下面積最大的色塊當剪影主色。
 *
 * 色塊以「眾數 bucket + 連通鄰域」界定，回傳整塊的面積加權均值。
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
  const counts = new Map<string, Bucket>();
  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (colorDistance([r, g, b], bg) < 36) continue;
    const key = bucketKey(quantize(r), quantize(g), quantize(b));
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
  let bestKey: string | null = null;
  let best: Bucket | null = null;
  for (const [key, entry] of counts) {
    if (!best || entry.count > best.count) {
      best = entry;
      bestKey = key;
    }
  }
  if (!best || !bestKey) return null;
  const region = growRegion(counts, bestKey, best);
  return rgbToHex(
    region.r / region.count,
    region.g / region.count,
    region.b / region.count,
  );
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
