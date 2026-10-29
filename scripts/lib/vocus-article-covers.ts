/**
 * 站方指定的封面。方格子同步重寫該篇時沿用這裡，不改去抓縮圖。
 * 鍵是方格子 contentId。
 */
export type PinnedVocusCover = {
  readonly src: string;
  readonly alt: string;
  /** 單篇首圖用原圖比例。列表卡仍是 16:9 裁切框。 */
  readonly width: number;
  readonly height: number;
};

export const PINNED_VOCUS_COVERS: Readonly<Record<string, PinnedVocusCover>> = {
  "6ae34027fd897800012f3e51": {
    src: "/parent-articles/vocus-6ae34027fd897800012f3e51-cover.webp",
    alt: "小松 PC4000 大型怪手前，大人與小孩的背影",
    width: 1600,
    height: 2133,
  },
};

export function contentIdFromVocusSlug(slug: string): string | null {
  const match = /^vocus-([a-f0-9]{24})(?:-\d+)?$/.exec(slug);
  return match?.[1] ?? null;
}

export function pinnedVocusCover(slug: string): PinnedVocusCover | undefined {
  const contentId = contentIdFromVocusSlug(slug);
  if (!contentId) return undefined;
  return PINNED_VOCUS_COVERS[contentId];
}

/**
 * 有指定封面就用指定的，而且不要下載方格子縮圖蓋掉檔案。
 * 沒有指定、但有 og／縮圖網址時，才下載成 `<slug>-cover.webp`。
 */
export function coverForVocusArticle(
  slug: string,
  ogImageURL: string | null,
): { coverImage?: string; coverAlt?: string; coverWidth?: number; coverHeight?: number; downloadOg: boolean } {
  const pinned = pinnedVocusCover(slug);
  if (pinned) {
    return {
      coverImage: pinned.src,
      coverAlt: pinned.alt,
      coverWidth: pinned.width,
      coverHeight: pinned.height,
      downloadOg: false,
    };
  }
  if (ogImageURL) {
    return {
      coverImage: `/parent-articles/${slug}-cover.webp`,
      downloadOg: true,
    };
  }
  return { downloadOg: false };
}
