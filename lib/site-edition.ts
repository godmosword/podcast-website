/**
 * 實驗站與官網的建置身份。
 *
 * 未設定時是 `current`：維持現有 Vercel 專案的全功能、可索引行為。
 * 不要在網域移轉前把現有專案設成 `lab` 或 `official`。
 * `official` 且沒有 `NEXT_PUBLIC_SITE_URL` 時，建置必須失敗。
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
 * `official` 缺網址就丟錯。lab 與 current 不在這裡改 fallback。
 * 實驗站 production 未設網址時仍走 `CANONICAL_SITE_URL`（vercel.app）。
 */
export function assertOfficialEditionConfigured(): void {
  if (process.env.SITE_EDITION?.trim() !== "official") return;
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return;
  throw new Error(
    "SITE_EDITION=official 時必須設定 NEXT_PUBLIC_SITE_URL，否則 canonical、sitemap 與 RSS 會退回實驗站。",
  );
}

/** 預覽部署與明確的 lab 不進索引。不要對一般爬蟲加全站 Disallow。 */
export function editionRobots(): { index: false; follow: true } | undefined {
  if (process.env.VERCEL_ENV === "preview" || getSiteEdition() === "lab") {
    return { index: false, follow: true };
  }
  return undefined;
}
