/** 兩位數檔名，如 1 → "01" */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** ISO 日期 "2026-06-01" → "2026.06.01" */
export function formatDate(iso: string): string {
  return iso.replaceAll("-", ".");
}

export function storyAssetBase(slug: string): string {
  return `/stories/${slug}`;
}

export function storyCoverPath(slug: string, page = 1): string {
  return `${storyAssetBase(slug)}/${pad2(page)}.jpg`;
}

export function storyAudioPath(slug: string, filename: string): string {
  return `${storyAssetBase(slug)}/${filename}`;
}
