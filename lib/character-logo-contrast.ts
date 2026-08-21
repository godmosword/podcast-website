import {
  LOGO_EYE_HEX,
  contrastRatio as wcagContrastRatio,
  parseHexColor,
  relativeLuminance as wcagRelativeLuminance,
} from "@/data/character-logos";

/** WCAG 剪影下限。硬閘門另加模型漂移餘裕。 */
export const SILHOUETTE_CONTRAST_MIN = 3;
/** 軌道 1：產圖硬閘門（image model 不會精準命中 hex）。 */
export const SILHOUETTE_CONTRAST_GATE = 3.6;
/** 貼線視同未過；margin = silhouette − 3.6。 */
export const MARGIN_MIN = 0.2;
/** 軌道 2：高彩度識別色的剪影下限。 */
export const SILHOUETTE_HUE_TRACK_MIN = 2.8;
/** 軌道 2：primary 對背景的 OKLCH 色相最短距離。 */
export const HUE_DISTANCE_MIN = 60;
/** 軌道 2：只給高彩度識別色，不是通用放寬。 */
export const CHROMA_TRACK_MIN = 0.12;
/** WCAG 臉部標記下限。 */
export const FACE_CONTRAST_MIN = 4.5;
/** 產圖硬閘門：臉部標記對較亮 IP 色。 */
export const FACE_CONTRAST_GATE = 5;

export type ContrastAuditEntry = {
  ipColorPrimary: string;
  ipColorSecondary: string;
};

export type ContrastTrack = 1 | 2;

export type ContrastAuditResult = {
  silhouette: number;
  face: number;
  passes: boolean;
  margin: number;
  hueDist: number;
  chroma: number;
  track1: boolean;
  track2: boolean;
  track: ContrastTrack | null;
};

export function relativeLuminance(hex: string): number {
  return wcagRelativeLuminance(hex);
}

export function contrastRatio(a: string, b: string): number {
  return wcagContrastRatio(a, b);
}

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

type Oklab = { L: number; a: number; b: number };

function hexToOklab(hex: string): Oklab {
  const [r8, g8, b8] = parseHexColor(hex);
  const r = srgbToLinear(r8);
  const g = srgbToLinear(g8);
  const b = srgbToLinear(b8);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/** OKLCH 色相角，0–360。無彩度時回 0。 */
export function hueAngle(hex: string): number {
  const { a, b } = hexToOklab(hex);
  if (a === 0 && b === 0) return 0;
  const deg = (Math.atan2(b, a) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}

/** 環形最短距離，0–180。 */
export function hueDistance(a: string, b: string): number {
  const delta = Math.abs(hueAngle(a) - hueAngle(b));
  return Math.min(delta, 360 - delta);
}

/** OKLCH 彩度。 */
export function chroma(hex: string): number {
  const { a, b } = hexToOklab(hex);
  return Math.hypot(a, b);
}

function lighterIpHex(entry: ContrastAuditEntry): string {
  return relativeLuminance(entry.ipColorPrimary) >=
    relativeLuminance(entry.ipColorSecondary)
    ? entry.ipColorPrimary
    : entry.ipColorSecondary;
}

export function trackLabel(result: Pick<ContrastAuditResult, "track1" | "track2">): string {
  if (result.track1 && result.track2) return "1+2";
  if (result.track1) return "1";
  if (result.track2) return "2";
  return "—";
}

/**
 * 剪影 = primary 對家族背景；臉部 = 眼標記對兩 IP 色中較亮者。
 * 不檢查 secondary 對背景（內部色，不接觸背景）。
 * 雙軌擇一：軌道 1 亮度分離，或軌道 2 高彩度色相分離。
 */
export function auditEntry(
  entry: ContrastAuditEntry,
  familyBg: string,
): ContrastAuditResult {
  const silhouette = contrastRatio(entry.ipColorPrimary, familyBg);
  const face = contrastRatio(LOGO_EYE_HEX, lighterIpHex(entry));
  const margin = silhouette - SILHOUETTE_CONTRAST_GATE;
  const hueDist = hueDistance(entry.ipColorPrimary, familyBg);
  const chromaPrimary = chroma(entry.ipColorPrimary);
  const track1 =
    silhouette >= SILHOUETTE_CONTRAST_GATE && margin >= MARGIN_MIN;
  const track2 =
    silhouette >= SILHOUETTE_HUE_TRACK_MIN &&
    hueDist >= HUE_DISTANCE_MIN &&
    chromaPrimary >= CHROMA_TRACK_MIN;
  const facePass = face >= FACE_CONTRAST_GATE;
  const passes = facePass && (track1 || track2);
  const track: ContrastTrack | null = track1 ? 1 : track2 ? 2 : null;
  return {
    silhouette,
    face,
    passes,
    margin,
    hueDist,
    chroma: chromaPrimary,
    track1,
    track2,
    track,
  };
}
