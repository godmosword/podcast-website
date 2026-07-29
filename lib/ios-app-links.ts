import { CANONICAL_SITE_URL, getSiteUrl } from "@/lib/site-url";

/** 與 Xcode `PRODUCT_BUNDLE_IDENTIFIER` 對齊。 */
export const IOS_BUNDLE_ID = "app.chechecar.ios";

/** Associated Domains 用的主機名（不含 protocol）。 */
export function iosAssociatedDomainHost(
  siteUrl: string = CANONICAL_SITE_URL,
): string {
  return new URL(siteUrl).host;
}

/**
 * Apple `appID` = `{TeamID}.{bundleId}`。
 * 未設 `APPLE_TEAM_ID` 時回 `null`（AASA details 為空，避免錯誤 Team 汙染 CDN）。
 */
export function appleAppId(
  teamId = process.env.APPLE_TEAM_ID?.trim() ?? "",
): string | null {
  if (!teamId) return null;
  return `${teamId}.${IOS_BUNDLE_ID}`;
}

/** Universal Links 路徑元件（給 AASA `components`）。 */
export const IOS_APP_LINK_COMPONENTS = [
  { "/": "/stories" },
  { "/": "/stories/" },
  { "/": "/story/*" },
] as const;

export type AppleAppSiteAssociation = {
  applinks: {
    apps: [];
    details: Array<{
      appIDs: string[];
      components: Array<{ "/": string }>;
    }>;
  };
};

/** 組裝 AASA JSON；無 Team ID 時 details 為空陣列。 */
export function buildAppleAppSiteAssociation(
  teamId = process.env.APPLE_TEAM_ID?.trim() ?? "",
): AppleAppSiteAssociation {
  const appId = appleAppId(teamId);
  return {
    applinks: {
      apps: [],
      details: appId
        ? [
            {
              appIDs: [appId],
              components: IOS_APP_LINK_COMPONENTS.map((c) => ({ "/": c["/"] })),
            },
          ]
        : [],
    },
  };
}

/** 單集頁「用 App 看圖聽」絕對 URL（安裝後由 Universal Link 開啟 App）。 */
export function storyAppLinkUrl(slug: string, siteUrl = getSiteUrl()): string {
  return `${siteUrl}/story/${slug}`;
}

/** 播放頁深連結。 */
export function storyPlayAppLinkUrl(
  slug: string,
  siteUrl = getSiteUrl(),
): string {
  return `${siteUrl}/story/${slug}/play`;
}

/** App Store 產品頁（可選；未設則 CTA 只連站內 Universal Link）。 */
export function iosAppStoreUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Smart App Banner 用的數字 App ID（可選）。 */
export function iosAppStoreId(): string | null {
  const id = process.env.NEXT_PUBLIC_IOS_APP_STORE_ID?.trim();
  return id && /^\d+$/.test(id) ? id : null;
}
