import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CANONICAL_SITE_URL,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  getSiteUrl,
  isTrackedProductionOrigin,
} from "./site-url";

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("正式站網域是 carcarplayground.com", () => {
    expect(CANONICAL_SITE_URL).toBe("https://carcarplayground.com");
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

  it("官網缺 NEXT_PUBLIC_SITE_URL 時失敗，不退回實驗站", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_EDITION", "official");
    vi.stubEnv("SITE_EDITION", "official");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("官網與實驗站都能當 --production 的目標，預覽網址不行", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://carcarplayground.com");
    expect(isTrackedProductionOrigin("https://carcarplayground.com")).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", CANONICAL_SITE_URL);
    expect(isTrackedProductionOrigin(CANONICAL_SITE_URL)).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.vercel.app");
    expect(isTrackedProductionOrigin("https://preview.vercel.app")).toBe(false);
  });

  it("回傳值一律不含尾斜線", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com///");
    expect(getSiteUrl()).toBe("https://example.com");
  });
});

describe("default OG image", () => {
  it("檔案是 1200×630，而且小於 300KB", async () => {
    const file = join(PUBLIC_DIR, DEFAULT_OG_IMAGE.slice(1));
    expect(statSync(file).size).toBeLessThan(300 * 1024);
    const meta = await sharp(file).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(DEFAULT_OG_IMAGE_WIDTH);
    expect(meta.height).toBe(DEFAULT_OG_IMAGE_HEIGHT);
  });
});
