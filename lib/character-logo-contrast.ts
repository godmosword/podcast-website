import {
  LOGO_EYE_HEX,
  contrastRatio as wcagContrastRatio,
  parseHexColor,
  relativeLuminance as wcagRelativeLuminance,
} from "@/data/character-logos";

/** 色相遠離時的剪影門檻。 */
export const SILHOUETTE_GATE_FAR = 2.8;
/** 色相中距時的剪影門檻。 */
export const SILHOUETTE_GATE_MID = 3.6;
/** 色相呼應（同色相）時的剪影門檻。 */
export const SILHOUETTE_GATE_NEAR = 4.5;
/** 與舊稱對齊：中距門檻。 */
export const SILHOUETTE_CONTRAST_GATE = SILHOUETTE_GATE_MID;
/** 貼線視同未過；margin = silhouette − 該筆適用門檻。 */
export const MARGIN_MIN = 0.2;
/** hueDist ≥ 此值視為遠離，門檻 2.8。 */
export const HUE_FAR_MIN = 60;
/** hueDist ≥ 此值且 ＜ 60 視為中距，門檻 3.6。 */
export const HUE_MID_MIN = 30;
/** WCAG 臉部標記下限。 */
export const FACE_CONTRAST_MIN = 4.5;
/** 產圖硬閘門：臉部標記對較亮 IP 色。 */
export const FACE_CONTRAST_GATE = 5;
/** 次色對家族背景（WCAG，不隨 hue 加權）。 */
export const SECONDARY_CONTRAST_MIN = 3;

export type ContrastAuditEntry = {
  ipColorPrimary: string;
  ipColorSecondary: string;
};

export type ContrastAuditResult = {
  silhouette: number;
  secondary: number;
  face: number;
  passes: boolean;
  margin: number;
  faceMargin: number;
  hueDist: number;
  chroma: number;
  gate: number;
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

/** 依色相距離決定剪影門檻：遠離 2.8、中距 3.6、呼應 4.5。 */
export function silhouetteGate(hueDist: number): number {
  if (hueDist >= HUE_FAR_MIN) return SILHOUETTE_GATE_FAR;
  if (hueDist >= HUE_MID_MIN) return SILHOUETTE_GATE_MID;
  return SILHOUETTE_GATE_NEAR;
}

function lighterIpHex(entry: ContrastAuditEntry): string {
  return relativeLuminance(entry.ipColorPrimary) >=
    relativeLuminance(entry.ipColorSecondary)
    ? entry.ipColorPrimary
    : entry.ipColorSecondary;
}

/**
 * 剪影 = primary 對家族背景（hue 加權）；次色對背景 ≥ 3:1；
 * 臉部 = 眼標記對兩 IP 色中較亮者。
 * margin = silhouette − 適用門檻；faceMargin = face − 5.0；皆須 ≥ 0.2。
 */
export function auditEntry(
  entry: ContrastAuditEntry,
  familyBg: string,
): ContrastAuditResult {
  const silhouette = contrastRatio(entry.ipColorPrimary, familyBg);
  const secondary = contrastRatio(entry.ipColorSecondary, familyBg);
  const face = contrastRatio(LOGO_EYE_HEX, lighterIpHex(entry));
  const hueDist = hueDistance(entry.ipColorPrimary, familyBg);
  const chromaPrimary = chroma(entry.ipColorPrimary);
  const gate = silhouetteGate(hueDist);
  const margin = silhouette - gate;
  const faceMargin = face - FACE_CONTRAST_GATE;
  const passes =
    face >= FACE_CONTRAST_GATE &&
    faceMargin >= MARGIN_MIN &&
    silhouette >= gate &&
    margin >= MARGIN_MIN &&
    secondary >= SECONDARY_CONTRAST_MIN;
  return {
    silhouette,
    secondary,
    face,
    passes,
    margin,
    faceMargin,
    hueDist,
    chroma: chromaPrimary,
    gate,
  };
}
