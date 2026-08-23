import { modernRasterPaths, type ModernRasterPaths } from "./modern-image-src";

const STORY_COVER_RE = /\/stories\/[^/]+\/01\.jpe?g$/i;

/** 播放頁 LCP 封面（01.jpg）才有預生成 AVIF／WebP；其餘幕維持 JPG。 */
export function isStoryCoverRaster(src: string): boolean {
  const path = src.split("?")[0] ?? "";
  return STORY_COVER_RE.test(path);
}

export function storyPlayImageSources(src: string): ModernRasterPaths {
  return modernRasterPaths(src);
}

/** SW CACHE_STORY：JPG 全列＋封面現代格式，離線仍可 fallback JPG。 */
export function storyPlayCacheUrls(
  audio: string,
  images: readonly string[],
): string[] {
  const extras = images.flatMap((src) => {
    if (!isStoryCoverRaster(src)) return [];
    const paths = modernRasterPaths(src);
    return [paths.avif, paths.webp];
  });
  return [audio, ...images, ...extras];
}
