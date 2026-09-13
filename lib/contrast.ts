/**
 * WCAG 2.1 相對亮度與對比度。
 *
 * 存在的理由是「讓對比可以被測試釘住」：DESIGN.md 到處記著實測對比值，但那些
 * 數字是人工量的，改 token 時沒有任何東西會擋。有了這支，色彩門檻就能寫成
 * 單元測試（見 `app/globals.css.contrast.test.ts`）。
 *
 * 只處理 sRGB 的不透明色。`color-mix()`／`var()` 需由呼叫端先解析成 hex。
 */

export type Rgb = { r: number; g: number; b: number };

/** `#rgb`／`#rrggbb`（大小寫皆可）→ 0–255 三元組；格式不合丟例外。 */
export function parseHex(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, "");
  const expanded =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`不是合法的 sRGB hex：${hex}`);
  }

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

/** sRGB 單通道 → 線性值（WCAG 2.x 的 gamma 展開）。 */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 相對亮度，0（黑）–1（白）。 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  );
}

/** 兩色對比度，1–21；與參數順序無關。 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/** AA 內文門檻（< 18.66px bold／< 24px regular）。 */
export const AA_NORMAL_TEXT = 4.5;
/** AA 大字門檻。 */
export const AA_LARGE_TEXT = 3;
/** AA 非文字（圖示、表單邊框）門檻。 */
export const AA_NON_TEXT = 3;
