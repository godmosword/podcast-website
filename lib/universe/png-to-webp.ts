/** PNG 路徑 → 同名 WebP（`/foo/bar.png` → `/foo/bar.webp`）。 */
export function pngToWebp(pngPath: string): string {
  return pngPath.replace(/\.png$/i, ".webp");
}

/** 依 WebP 支援選擇實際載入路徑（SVG `<image href>` 用）。 */
/*
 * 這裡曾有 `resolveTextureHref(pngPath, webpSupported)` 搭配 `useWebpSupported`
 * 做執行期偵測，但那組合對 SVG `<image href>` 是反效果：偵測要等 effect 跑完，
 * 所以 SSR 與首次繪製送出的是 PNG，瀏覽器的 preload scanner 立刻開抓
 * （`sea.png` 1.9MB），之後 href 才換成 webp——結果兩個都下載。
 *
 * WebP 自 Safari 14／iOS 14 起全面支援，比本站已經依賴的 `:has()`、container
 * query、`color-mix()` 都早；抓不到 webp 的瀏覽器本來就渲染不了這張地圖。
 * 因此 SVG 貼圖一律直接給 webp，不再保留 PNG fallback 路徑。
 * `<img>` 能用 `<picture>` 的地方（日月、島 tile）仍保留 PNG fallback。
 */
