/**
 * D1：故事封面 blur placeholder（動態 src 無 Next 內建 LQIP）。
 * 由 `npm run generate:story-blurs` 產生 `data/story-image-blurs.json`。
 */
import blurs from "@/data/story-image-blurs.json";

const BLUR_BY_SRC: Readonly<Record<string, string>> = blurs;

export function getStoryBlurDataUrl(src: string): string | undefined {
  return BLUR_BY_SRC[src];
}
