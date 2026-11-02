/**
 * 站方指定的列表摘要。方格子同步重寫該篇時沿用這裡，不改回開頭原文。
 * 鍵是方格子 contentId。正文 blocks 仍來自方格子，不要寫進這裡。
 */
import { contentIdFromVocusSlug } from "./vocus-article-covers";

export const PINNED_VOCUS_EXCERPTS: Readonly<Record<string, string>> = {
  "6ae34027fd897800012f3e51":
    "帶孩子到 JR 小松站旁的小松之杜，近看超大自卸卡車 930E 與巨型挖土機 PC4000，還親手操作了小型挖土機。雨停後大機具真的動起來，車車遊樂園又解鎖一種特殊車子！",
};

export function pinnedVocusExcerpt(slug: string): string | undefined {
  const contentId = contentIdFromVocusSlug(slug);
  if (!contentId) return undefined;
  return PINNED_VOCUS_EXCERPTS[contentId];
}

/** 有指定摘要就用指定的，否則用開頭原文。 */
export function excerptForVocusArticle(slug: string, generated: string): string {
  return pinnedVocusExcerpt(slug) ?? generated;
}
