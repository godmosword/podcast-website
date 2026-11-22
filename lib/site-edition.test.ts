import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertSiteEditionConfigured,
  editionRobots,
  getSiteEdition,
  OFFICIAL_SITE_ORIGIN,
} from "./site-edition";

describe("site edition", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("未設定時維持 current", () => {
    vi.stubEnv("SITE_EDITION", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_EDITION", "");
    expect(getSiteEdition()).toBe("current");
    expect(editionRobots()).toBeUndefined();
  });

  it("lab 用 noindex，仍允許爬蟲看見標記", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_EDITION", "lab");
    expect(getSiteEdition()).toBe("lab");
    expect(editionRobots()).toEqual({ index: false, follow: true });
  });

  it("preview 不論 edition 都 noindex", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_EDITION", "official");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(editionRobots()).toEqual({ index: false, follow: true });
  });

  it("官網正式環境可索引", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_EDITION", "official");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(editionRobots()).toBeUndefined();
    expect(OFFICIAL_SITE_ORIGIN).toBe("https://carcarplayground.com");
  });
});

describe("assertSiteEditionConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function stub(edition: string, vercelEnv: string, siteUrl = ""): void {
    vi.stubEnv("SITE_EDITION", edition);
    vi.stubEnv("VERCEL_ENV", vercelEnv);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", siteUrl);
  }

  it("official 缺網址，不論環境都擋", () => {
    stub("official", "preview");
    expect(() => assertSiteEditionConfigured()).toThrow("SITE_EDITION=official");
  });

  it("lab 的 production 缺網址要擋，免得 canonical 指到正式網域", () => {
    stub("lab", "production");
    expect(() => assertSiteEditionConfigured()).toThrow("SITE_EDITION=lab");
  });

  it("lab 的預覽部署走 VERCEL_URL，不必設網址", () => {
    stub("lab", "preview");
    expect(() => assertSiteEditionConfigured()).not.toThrow();
  });

  it("設了網址就放行", () => {
    stub("lab", "production", "https://podcast-website-mu.vercel.app");
    expect(() => assertSiteEditionConfigured()).not.toThrow();
    stub("official", "production", OFFICIAL_SITE_ORIGIN);
    expect(() => assertSiteEditionConfigured()).not.toThrow();
  });

  it("未設版別（本機、CI）不檢查", () => {
    stub("", "production");
    expect(() => assertSiteEditionConfigured()).not.toThrow();
  });
});
