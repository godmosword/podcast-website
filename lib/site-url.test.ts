import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_SITE_URL, getSiteUrl } from "./site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("優先使用 NEXT_PUBLIC_SITE_URL，並去掉尾斜線", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://chechepark.tw/");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "chechecar-temp.vercel.app");
    expect(getSiteUrl()).toBe("https://chechepark.tw");
  });

  it("production 未設 NEXT_PUBLIC_SITE_URL 時回傳 canonical，而非臨時 VERCEL_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "chechecar-abc123.vercel.app");
    expect(getSiteUrl()).toBe(CANONICAL_SITE_URL);
    expect(getSiteUrl()).not.toContain("abc123");
  });

  it("preview 部署使用臨時 VERCEL_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "chechecar-abc123.vercel.app");
    expect(getSiteUrl()).toBe("https://chechecar-abc123.vercel.app");
  });

  it("本機（無任何網域 env）回傳 localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("回傳值一律不含尾斜線", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com///");
    expect(getSiteUrl()).toBe("https://example.com");
  });
});
