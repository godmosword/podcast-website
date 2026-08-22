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

/** bucket 要進入色塊的最小佔比（相對於全部非背景像素）；擋掉區塊交界的反鋸齒橋接。 */
const BUCKET_MIN_SHARE = 0.005;

function bucketKey(r: number, g: number, b: number): string {
  return `${r},${g},${b}`;
}

/**
 * 把量化 bucket 依 26 鄰域連通性切成色塊，回傳面積最大的那一塊。
 *
 * 連續漸層會把單一色塊打散成一條相鄰的 bucket 稜線，平塗色塊則集中在單一 bucket；
 * 若直接取眾數 bucket，會誤把面積較小但平坦的色塊（例如擋風玻璃）當成主色。
 * 因此先長成色塊再比面積。反鋸齒交界的 bucket 像素量遠低於色塊本體，用佔比門檻
 * 濾掉，避免相鄰色塊被橋接成同一塊。
 */
function largestRegion(
  counts: ReadonlyMap<string, Bucket>,
  totalPixels: number,
): Bucket | null {
  const minCount = totalPixels * BUCKET_MIN_SHARE;
  const live = new Set<string>();
  for (const [key, bucket] of counts) {
    if (bucket.count >= minCount) live.add(key);
  }
  if (live.size === 0) return null;

  const seen = new Set<string>();
  let best: Bucket | null = null;

  for (const seedKey of live) {
    if (seen.has(seedKey)) continue;
    const region: Bucket = { count: 0, r: 0, g: 0, b: 0 };
    const queue: string[] = [seedKey];
    seen.add(seedKey);

    while (queue.length > 0) {
      const key = queue.pop()!;
      const bucket = counts.get(key)!;
      region.count += bucket.count;
      region.r += bucket.r;
      region.g += bucket.g;
      region.b += bucket.b;

      const [qr, qg, qb] = key.split(",").map(Number) as [number, number, number];
      for (const dr of [-16, 0, 16]) {
        for (const dg of [-16, 0, 16]) {
          for (const db of [-16, 0, 16]) {
            if (dr === 0 && dg === 0 && db === 0) continue;
            const next = bucketKey(qr + dr, qg + dg, qb + db);
            if (seen.has(next) || !live.has(next)) continue;
            seen.add(next);
            queue.push(next);
          }
        }
      }
    }

    if (!best || region.count > best.count) best = region;
  }

  return best;
}

/**
 * 從產出圖取樣主色：丟掉接近家族底的像素，剩下面積最大的色塊當剪影主色。
 *
 * 色塊以量化 bucket 的連通分量界定，回傳整塊的面積加權均值。
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
  let totalPixels = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (colorDistance([r, g, b], bg) < 36) continue;
    totalPixels += 1;
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
  const region = largestRegion(counts, totalPixels);
  if (!region) return null;
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
