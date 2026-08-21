import {
  LOGO_EYE_HEX,
  contrastRatio as wcagContrastRatio,
  parseHexColor,
  relativeLuminance as wcagRelativeLuminance,
  type FaceSurface,
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
/** 產圖硬閘門：臉部標記對 faceSurface 指定的 IP 色。 */
export const FACE_CONTRAST_GATE = 5;
/** 次色構成外輪廓時，對家族背景的門檻（再加 margin）。 */
export const SECONDARY_BG_GATE = 3.6;
/** 次色被主色包住時，對主色的內部可辨門檻（再加 margin）。 */
export const SECONDARY_INTERNAL_GATE = 1.8;
/** 次色對主色：對比下限（與色相閘門擇一）。35 筆全套用。 */
export const SECONDARY_VS_PRIMARY_CONTRAST_MIN = 1.6;
/** 次色對主色：色相距離下限（與對比閘門擇一）。 */
export const SECONDARY_VS_PRIMARY_HUE_MIN = 30;

export type { FaceSurface };

export type ContrastAuditEntry = {
  ipColorPrimary: string;
  ipColorSecondary: string;
  faceSurface: FaceSurface;
  secondaryTouchesBackground: boolean;
};

export type ContrastAuditResult = {
  silhouette: number;
  secondary: number;
  secondaryVsBackground: number;
  secondaryVsPrimary: number;
  secondaryGate: number;
  secondaryMargin: number;
  secondaryVsPrimaryHueDist: number;
  secondaryDistinguishable: boolean;
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

export function faceSurfaceHex(entry: ContrastAuditEntry): string {
  return entry.faceSurface === "primary"
    ? entry.ipColorPrimary
    : entry.ipColorSecondary;
}

export function secondaryGateFor(touchesBackground: boolean): number {
  return touchesBackground ? SECONDARY_BG_GATE : SECONDARY_INTERNAL_GATE;
}

/** 識別特徵在 32px 必須從車身分得出來：對比 ≥ 1.6 或色相差 ≥ 30，擇一。 */
export function secondaryDistinguishableFromPrimary(
  contrastVsPrimary: number,
  hueDistVsPrimary: number,
): boolean {
  return (
    contrastVsPrimary >= SECONDARY_VS_PRIMARY_CONTRAST_MIN ||
    hueDistVsPrimary >= SECONDARY_VS_PRIMARY_HUE_MIN
  );
}

/**
 * 剪影 = primary 對家族背景（hue 加權）。
 * 次色：構成外輪廓則對背景 ≥ 3.6；否則對主色 ≥ 1.8。
 * 另查次色對主色可辨：對比 ≥ 1.6 或色相差 ≥ 30（擇一；無額外 margin）。
 * 臉部 = 眼標記對 `faceSurface` 指定的那塊，不用較亮者推測。
 * 剪影／臉部／條件次色門檻皆須 margin ≥ 0.2。
 */
export function auditEntry(
  entry: ContrastAuditEntry,
  familyBg: string,
): ContrastAuditResult {
  const silhouette = contrastRatio(entry.ipColorPrimary, familyBg);
  const secondaryVsBackground = contrastRatio(
    entry.ipColorSecondary,
    familyBg,
  );
  const secondaryVsPrimary = contrastRatio(
    entry.ipColorSecondary,
    entry.ipColorPrimary,
  );
  const secondaryGate = secondaryGateFor(entry.secondaryTouchesBackground);
  const secondary = entry.secondaryTouchesBackground
    ? secondaryVsBackground
    : secondaryVsPrimary;
  const face = contrastRatio(LOGO_EYE_HEX, faceSurfaceHex(entry));
  const hueDist = hueDistance(entry.ipColorPrimary, familyBg);
  const chromaPrimary = chroma(entry.ipColorPrimary);
  const gate = silhouetteGate(hueDist);
  const margin = silhouette - gate;
  const faceMargin = face - FACE_CONTRAST_GATE;
  const secondaryMargin = secondary - secondaryGate;
  const secondaryVsPrimaryHueDist = hueDistance(
    entry.ipColorSecondary,
    entry.ipColorPrimary,
  );
  const secondaryDistinguishable = secondaryDistinguishableFromPrimary(
    secondaryVsPrimary,
    secondaryVsPrimaryHueDist,
  );
  const passes =
    face >= FACE_CONTRAST_GATE &&
    faceMargin >= MARGIN_MIN &&
    silhouette >= gate &&
    margin >= MARGIN_MIN &&
    secondary >= secondaryGate &&
    secondaryMargin >= MARGIN_MIN &&
    secondaryDistinguishable;
  return {
    silhouette,
    secondary,
    secondaryVsBackground,
    secondaryVsPrimary,
    secondaryGate,
    secondaryMargin,
    secondaryVsPrimaryHueDist,
    secondaryDistinguishable,
    face,
    passes,
    margin,
    faceMargin,
    hueDist,
    chroma: chromaPrimary,
    gate,
  };
}
