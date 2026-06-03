/** 全站預設 OG／Twitter 分享圖（相對路徑，由 metadataBase 解析為絕對網址） */
export const DEFAULT_OG_IMAGE = "/mascot.png";

/**
 * 正式站網址，供 metadataBase 與絕對 URL 解析。
 * 僅讀取 NEXT_PUBLIC_SITE_URL，不使用 VERCEL_URL（preview 部署網域會污染分享圖）。
 */
export function getSiteUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

/** Next.js Metadata.metadataBase */
export function getMetadataBase(): URL | undefined {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return undefined;
  try {
    return new URL(siteUrl);
  } catch {
    return undefined;
  }
}
