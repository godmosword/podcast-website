/** PNG 路徑 → 同名 WebP（`/foo/bar.png` → `/foo/bar.webp`）。 */
export function pngToWebp(pngPath: string): string {
  return pngPath.replace(/\.png$/i, ".webp");
}

/** 依 WebP 支援選擇實際載入路徑（SVG `<image href>` 用）。 */
export function resolveTextureHref(pngPath: string, webpSupported: boolean): string {
  return webpSupported ? pngToWebp(pngPath) : pngPath;
}
