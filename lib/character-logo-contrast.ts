import {
  LOGO_EYE_HEX,
  contrastRatio as wcagContrastRatio,
  relativeLuminance as wcagRelativeLuminance,
} from "@/data/character-logos";

/** WCAG 剪影下限。硬閘門另加模型漂移餘裕。 */
export const SILHOUETTE_CONTRAST_MIN = 3;
/** 產圖硬閘門：image model 不會精準命中 hex。 */
export const SILHOUETTE_CONTRAST_GATE = 3.6;
/** WCAG 臉部標記下限。 */
export const FACE_CONTRAST_MIN = 4.5;
/** 產圖硬閘門：臉部標記對較亮 IP 色。 */
export const FACE_CONTRAST_GATE = 5;

export type ContrastAuditEntry = {
  ipColorPrimary: string;
  ipColorSecondary: string;
};

export type ContrastAuditResult = {
  silhouette: number;
  face: number;
  passes: boolean;
  margin: number;
};

export function relativeLuminance(hex: string): number {
  return wcagRelativeLuminance(hex);
}

export function contrastRatio(a: string, b: string): number {
  return wcagContrastRatio(a, b);
}

function lighterIpHex(entry: ContrastAuditEntry): string {
  return relativeLuminance(entry.ipColorPrimary) >=
    relativeLuminance(entry.ipColorSecondary)
    ? entry.ipColorPrimary
    : entry.ipColorSecondary;
}

/**
 * 剪影 = primary 對家族背景；臉部 = 眼標記對兩 IP 色中較亮者。
 * 不檢查 secondary 對背景（內部色，不接觸背景）。
 */
export function auditEntry(
  entry: ContrastAuditEntry,
  familyBg: string,
): ContrastAuditResult {
  const silhouette = contrastRatio(entry.ipColorPrimary, familyBg);
  const face = contrastRatio(LOGO_EYE_HEX, lighterIpHex(entry));
  const margin = silhouette - SILHOUETTE_CONTRAST_GATE;
  const passes =
    silhouette >= SILHOUETTE_CONTRAST_GATE && face >= FACE_CONTRAST_GATE;
  return { silhouette, face, passes, margin };
}
