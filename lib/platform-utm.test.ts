import { describe, expect, it } from "vitest";
import { appendPlatformUtm, platformUtmMedium } from "./platform-utm";

describe("platformUtmMedium", () => {
  it("subscription-cta 對應 subscribe_cta", () => {
    expect(platformUtmMedium("subscription-cta")).toBe("subscribe_cta");
  });

  it("footer-connect 對應 footer", () => {
    expect(platformUtmMedium("footer-connect")).toBe("footer");
  });
});

describe("appendPlatformUtm", () => {
  it("加上 cheche_web 三參數", () => {
    const out = appendPlatformUtm("https://open.spotify.com/show/abc", {
      source: "subscription-cta",
      campaign: "ep-12",
    });
    const parsed = new URL(out);
    expect(parsed.searchParams.get("utm_source")).toBe("cheche_web");
    expect(parsed.searchParams.get("utm_medium")).toBe("subscribe_cta");
    expect(parsed.searchParams.get("utm_campaign")).toBe("ep-12");
  });

  it("無 campaign 時預設 site", () => {
    const out = appendPlatformUtm("https://podcasts.apple.com/tw/id1", {
      source: "footer-connect",
    });
    expect(new URL(out).searchParams.get("utm_campaign")).toBe("site");
  });

  it("無效 URL 原樣回傳", () => {
    expect(
      appendPlatformUtm("not-a-url", { source: "nav-bar" }),
    ).toBe("not-a-url");
  });
});
