import { modernRasterPaths, type ModernRasterPaths } from "./modern-image-src";

const STORY_COVER_RE = /\/stories\/[^/]+\/01\.jpe?g$/i;
const STORY_PLAY_RE = /\/stories\/[^/]+\/\d{2}\.jpe?g$/i;

function storyRasterPath(src: string): string {
  return src.split("?")[0] ?? "";
}

/** 封面 01.jpg：部分 shell／SW extras 仍只加封面現代格式。 */
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

/** LRU 保護清單：正在播的音檔與插圖路徑。不代表立刻下載。 */
export function storyPlaybackProtectUrls(
  audio: string,
  images: readonly string[],
): string[] {
  const extras = images.flatMap((src) => {
    if (!isStoryPlayRaster(src)) return [];
    const paths = modernRasterPaths(src);
    return [paths.avif, paths.webp];
  });
  return [audio, ...images, ...extras];
}

/**
 * CACHE_STORY idle queue：current±1 已由播放器 picture 載入。
 * 其餘只排 AVIF，避免 JPG+AVIF 雙抓，也不主動抓完整 MP3。
 */
export function storyIdleCacheUrls(
  images: readonly string[],
  currentPage = 0,
): string[] {
  return images.flatMap((src, index) => {
    if (Math.abs(index - currentPage) <= 1) return [];
    if (!isStoryPlayRaster(src)) return [];
    return [storyPlayImageSources(src).avif];
  });
}
