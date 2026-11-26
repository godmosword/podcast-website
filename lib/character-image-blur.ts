/**
 * 角色圖鑑定裝照 blur placeholder。
 * 卡片用字串路徑，Next 不會自動產生 LQIP，由 `npm run generate:character-blurs` 寫入 manifest。
 */
import blurs from "@/data/character-image-blurs.json";

const BLUR_BY_SRC: Readonly<Record<string, string>> = blurs;

export function getCharacterBlurDataUrl(src: string): string | undefined {
  return BLUR_BY_SRC[src];
}
