/**
 * 實驗站與官網的建置身份。
 *
 * - `official`：Vercel 專案 `podcast-website-official`（追 `release`），服務正式網域。
 * - `lab`：Vercel 專案 `podcast-website`（追 `main`），只用 vercel.app 網址，不進索引。
 * - `current`：未設定時的預設，給本機與 CI 的 build 用；全部內容、可索引、保留 /studio。
 *
 * `official` 缺網址、或 `lab` 的 production 缺網址時，建置必須失敗。
 */

export const OFFICIAL_SITE_ORIGIN = "https://carcarplayground.com";

export type SiteEdition = "current" | "lab" | "official";

function readEdition(value: string | undefined): SiteEdition | null {
  const raw = value?.trim();
  if (raw === "official" || raw === "lab" || raw === "current") return raw;
  return null;
}

/** 客戶端只看得到被 build 寫進去的 NEXT_PUBLIC_SITE_EDITION。 */
export function getSiteEdition(): SiteEdition {
  return (
    readEdition(process.env.NEXT_PUBLIC_SITE_EDITION) ??
    readEdition(process.env.SITE_EDITION) ??
    "current"
  );
}

export function isOfficialEdition(): boolean {
  return getSiteEdition() === "official";
}

/**
 * 建置前檢查網址有沒有設。
 * - `official` 缺網址：canonical、sitemap 與 RSS 沒有可信的來源。
 * - `lab` 的 production 缺網址：`getSiteUrl()` 會退回正式網域，實驗站變成官網的重複內容。
 *   lab 的預覽部署不在此限，它們走 `VERCEL_URL`。
 */
export function assertSiteEditionConfigured(): void {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return;
  const edition = process.env.SITE_EDITION?.trim();
  if (edition === "official") {
    throw new Error(
      "SITE_EDITION=official 時必須設定 NEXT_PUBLIC_SITE_URL，否則 canonical、sitemap 與 RSS 會退回實驗站。",
    );
  }
  if (edition === "lab" && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "SITE_EDITION=lab 的 production 必須設定 NEXT_PUBLIC_SITE_URL（實驗站的 vercel.app 網址），否則 canonical、sitemap 與 RSS 會指到正式網域。",
    );
  }
}

/** 預覽部署與明確的 lab 不進索引。不要對一般爬蟲加全站 Disallow。 */
export function editionRobots(): { index: false; follow: true } | undefined {
  if (process.env.VERCEL_ENV === "preview" || getSiteEdition() === "lab") {
    return { index: false, follow: true };
  }
  return undefined;
}
