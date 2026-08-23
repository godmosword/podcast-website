import { modernRasterPaths, type ModernRasterPaths } from "./modern-image-src";

const STORY_COVER_RE = /\/stories\/[^/]+\/01\.jpe?g$/i;
const STORY_PLAY_RE = /\/stories\/[^/]+\/\d{2}\.jpe?g$/i;

function storyRasterPath(src: string): string {
  return src.split("?")[0] ?? "";
}

/** SW CACHE_STORY extras：只加封面現代格式，其餘幕離線仍走 JPG fallback。 */
export function isStoryCoverRaster(src: string): boolean {
  return STORY_COVER_RE.test(storyRasterPath(src));
}

/** 播放頁插圖（01.jpg 與後續幕）都有預生成 AVIF／WebP。 */
export function isStoryPlayRaster(src: string): boolean {
  return STORY_PLAY_RE.test(storyRasterPath(src));
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
