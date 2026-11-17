import { getSiteEdition } from "./site-edition";

/** 站名。metadata、JSON-LD 與 Media Session 共用同一個字面值。 */
export const SITE_NAME = "車車遊樂園";

/** 全站預設 Open Graph 圖（public 路徑）。 */
export const DEFAULT_OG_IMAGE = "/mascot.png";

/**
 * 正式站網域。Production 未設 NEXT_PUBLIC_SITE_URL 時用此值，
 * 確保 OG／分享連結永不指向每次部署的臨時 Vercel 網域。
 */
export const CANONICAL_SITE_URL = "https://podcast-website-mu.vercel.app";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * 站點絕對網址（RSS、metadata、分享連結用），回傳值不含尾斜線。
 * 優先序：
 *   1. NEXT_PUBLIC_SITE_URL（明確設定的正式網域）
 *   2. production → CANONICAL_SITE_URL（永不輸出臨時 deployment 網域）
 *   3. VERCEL_URL（僅 preview／開發部署的臨時網域）
 *   4. http://localhost:3000（本機）
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (getSiteEdition() === "official" && !fromEnv) {
    throw new Error(
      "SITE_EDITION=official 時必須設定 NEXT_PUBLIC_SITE_URL，否則 canonical、sitemap 與 RSS 會退回實驗站。",
    );
  }
  if (fromEnv) return stripTrailingSlash(fromEnv);

  if (process.env.VERCEL_ENV === "production") return CANONICAL_SITE_URL;

  if (process.env.VERCEL_URL) {
    return stripTrailingSlash(`https://${process.env.VERCEL_URL}`);
  }

  return "http://localhost:3000";
}

/** --production 可驗官網網域，也可驗實驗站 fallback 網域。兩邊的 site URL 必須與 base URL 相同。 */
export function isTrackedProductionOrigin(baseUrl: string, siteUrl = getSiteUrl()): boolean {
  try {
    const origin = new URL(baseUrl).origin;
    const siteOrigin = new URL(siteUrl).origin;
    if (origin !== siteOrigin) return false;
    return (
      origin === new URL(CANONICAL_SITE_URL).origin ||
      origin === "https://carcarplayground.com"
    );
  } catch {
    return false;
  }
}
