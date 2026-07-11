/** D1：JPG 同路徑次世代格式（預生成 WebP／AVIF，原生 picture 用）。 */

export type ModernRasterPaths = {
  jpg: string;
  webp: string;
  avif: string;
};

/** `/path/foo.jpg` → 同目錄 `.webp`／`.avif`（非 jpg 則三路徑相同）。 */
export function modernRasterPaths(jpgUrl: string): ModernRasterPaths {
  if (!/\.jpe?g$/i.test(jpgUrl)) {
    return { jpg: jpgUrl, webp: jpgUrl, avif: jpgUrl };
  }
  const base = jpgUrl.replace(/\.jpe?g$/i, "");
  return { jpg: jpgUrl, webp: `${base}.webp`, avif: `${base}.avif` };
}

export type LandingHeroPictureSources = {
  landscape: ModernRasterPaths;
  portrait: ModernRasterPaths | null;
};

/** Landing segment 雙軌 hero（橫版 + 可選直版）。 */
export function landingHeroPictureSources(
  heroImage: string,
  heroImagePortrait?: string | null,
): LandingHeroPictureSources {
  return {
    landscape: modernRasterPaths(heroImage),
    portrait: heroImagePortrait ? modernRasterPaths(heroImagePortrait) : null,
  };
}
