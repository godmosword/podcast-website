import { afterEach, describe, expect, it, vi } from "vitest";
import { editionRobots, getSiteEdition, OFFICIAL_SITE_ORIGIN } from "./site-edition";

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
