/** PNG 路徑 → 同名 WebP（`a-ku.png` → `a-ku.webp`；`a-ku.rear.png` → `a-ku.rear.webp`）。 */
export function roamerPngToWebp(pngSrc: string): string {
  return pngSrc.replace(/\.png$/i, ".webp");
}
