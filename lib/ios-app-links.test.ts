import { afterEach, describe, expect, it } from "vitest";
import {
  IOS_BUNDLE_ID,
  appleAppId,
  buildAppleAppSiteAssociation,
  iosAppStoreId,
  iosAppStoreUrl,
  iosAssociatedDomainHost,
  storyAppLinkUrl,
  storyPlayAppLinkUrl,
} from "@/lib/ios-app-links";
import { CANONICAL_SITE_URL } from "@/lib/site-url";

describe("ios-app-links", () => {
  const prevTeam = process.env.APPLE_TEAM_ID;
  const prevStore = process.env.NEXT_PUBLIC_IOS_APP_STORE_URL;
  const prevStoreId = process.env.NEXT_PUBLIC_IOS_APP_STORE_ID;

  afterEach(() => {
    if (prevTeam === undefined) delete process.env.APPLE_TEAM_ID;
    else process.env.APPLE_TEAM_ID = prevTeam;
    if (prevStore === undefined) delete process.env.NEXT_PUBLIC_IOS_APP_STORE_URL;
    else process.env.NEXT_PUBLIC_IOS_APP_STORE_URL = prevStore;
    if (prevStoreId === undefined) delete process.env.NEXT_PUBLIC_IOS_APP_STORE_ID;
    else process.env.NEXT_PUBLIC_IOS_APP_STORE_ID = prevStoreId;
  });

  it("associated domain 取自 canonical host", () => {
    expect(iosAssociatedDomainHost()).toBe(
      new URL(CANONICAL_SITE_URL).host,
    );
  });

  it("無 Team ID 時 appleAppId 為 null、AASA details 空", () => {
    delete process.env.APPLE_TEAM_ID;
    expect(appleAppId()).toBeNull();
    expect(buildAppleAppSiteAssociation("").applinks.details).toEqual([]);
  });

  it("有 Team ID 時組出 appID 與 story 路徑", () => {
    const aasa = buildAppleAppSiteAssociation("AB12CD34EF");
    expect(appleAppId("AB12CD34EF")).toBe(`AB12CD34EF.${IOS_BUNDLE_ID}`);
    expect(aasa.applinks.details).toHaveLength(1);
    expect(aasa.applinks.details[0].appIDs).toEqual([
      `AB12CD34EF.${IOS_BUNDLE_ID}`,
    ]);
    const paths = aasa.applinks.details[0].components.map((c) => c["/"]);
    expect(paths).toContain("/story/*");
    expect(paths).toContain("/stories");
  });

  it("story／play 深連結為絕對 URL", () => {
    expect(storyAppLinkUrl("ep-1", "https://example.test")).toBe(
      "https://example.test/story/ep-1",
    );
    expect(storyPlayAppLinkUrl("ep-1", "https://example.test")).toBe(
      "https://example.test/story/ep-1/play",
    );
  });

  it("App Store URL／ID 可選且驗證格式", () => {
    delete process.env.NEXT_PUBLIC_IOS_APP_STORE_URL;
    delete process.env.NEXT_PUBLIC_IOS_APP_STORE_ID;
    expect(iosAppStoreUrl()).toBeNull();
    expect(iosAppStoreId()).toBeNull();

    process.env.NEXT_PUBLIC_IOS_APP_STORE_URL =
      "https://apps.apple.com/app/id123";
    process.env.NEXT_PUBLIC_IOS_APP_STORE_ID = "1234567890";
    expect(iosAppStoreUrl()).toBe("https://apps.apple.com/app/id123");
    expect(iosAppStoreId()).toBe("1234567890");

    process.env.NEXT_PUBLIC_IOS_APP_STORE_ID = "not-a-number";
    expect(iosAppStoreId()).toBeNull();
  });
});
