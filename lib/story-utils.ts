/** 兩位數檔名，如 1 → "01" */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** ISO 日期 "2026-06-01" → "2026.06.01" */
export function formatDate(iso: string): string {
  return iso.replaceAll("-", ".");
}

function storyAssetBase(slug: string): string {
  return `/stories/${slug}`;
}

function externalAudioBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_AUDIO_BASE_URL?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function storyCoverPath(slug: string, page = 1): string {
  return `${storyAssetBase(slug)}/${pad2(page)}.jpg`;
}

export function storyAudioPath(slug: string, filename: string): string {
  return `${storyAssetBase(slug)}/${filename}`;
}

/**
 * Browser／RSS 用音檔 URL：可由外部公開音檔 origin 接手，未設定時維持本機
 * `/stories/` fallback。建置腳本與轉錄流程仍使用 storyAudioPath 讀 repo 檔案，
 * 避免把遠端 URL 當成 local filesystem path。
 */
export function storyAudioUrl(slug: string, filename: string): string {
  const base = externalAudioBase();
  return base
    ? `${base}${storyAssetBase(slug)}/${filename}`
    : storyAudioPath(slug, filename);
}
