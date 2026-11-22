import { OFFICIAL_SITE_ORIGIN, getSiteEdition } from "./site-edition";

/** 站名。metadata、JSON-LD 與 Media Session 共用同一個字面值。 */
export const SITE_NAME = "車車遊樂園";

/**
 * 全站預設 Open Graph 圖（public 路徑）。
 * 日間首頁第一屏截圖；故事、遊戲、地圖等專屬圖不走這張。
 */
export const DEFAULT_OG_IMAGE = "/og-home.jpg";
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_ALT = "車車遊樂園首頁";
export const DEFAULT_OG_IMAGE_TYPE = "image/jpeg";

/** 首頁與沒有專屬分享圖的頁面共用的 og:image／twitter:image。 */
export function defaultOgImage() {
  return {
    url: DEFAULT_OG_IMAGE,
    width: DEFAULT_OG_IMAGE_WIDTH,
    height: DEFAULT_OG_IMAGE_HEIGHT,
    alt: DEFAULT_OG_IMAGE_ALT,
    type: DEFAULT_OG_IMAGE_TYPE,
  };
}

/**
 * 正式站網域，與 `OFFICIAL_SITE_ORIGIN` 同一個值。Production 未設 NEXT_PUBLIC_SITE_URL 時用此值，
 * 確保 OG／分享連結永不指向每次部署的臨時 Vercel 網域（lab 的 production 會在 build 前被擋下）。
 */
export const CANONICAL_SITE_URL = OFFICIAL_SITE_ORIGIN;

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

/** --production 只驗正式網域，而且 site URL 必須與 base URL 同源。實驗站不進索引，不走這條。 */
export function isTrackedProductionOrigin(baseUrl: string, siteUrl = getSiteUrl()): boolean {
  try {
    const origin = new URL(baseUrl).origin;
    return origin === new URL(siteUrl).origin && origin === OFFICIAL_SITE_ORIGIN;
  } catch {
    return false;
  }
}
