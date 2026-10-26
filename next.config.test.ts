import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "./next.config";

describe("next security headers", () => {
  it("sets baseline browser hardening headers for every route", async () => {
    const groups = await nextConfig.headers?.();
    const allHeaders = groups?.flatMap((group) => group.headers) ?? [];

    expect(allHeaders).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(self), payment=()",
        },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
      ]),
    );
  });
});

describe("VISUAL_FIXTURE build（視覺回歸用的凍結資料）", () => {
  async function loadConfig(env: Record<string, string>) {
    vi.resetModules();
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    return (await import("./next.config")).default;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("沒開：用預設的 .next，bundle 裡寫死 VISUAL_FIXTURE_BUILD=0", async () => {
    const config = await loadConfig({ VISUAL_FIXTURE: "", CI: "", VERCEL: "" });
    expect(process.env.VISUAL_FIXTURE_BUILD).toBeUndefined();
    expect(config.distDir).toBeUndefined();
    expect(config.env?.VISUAL_FIXTURE_BUILD).toBe("0");
  });

  it("本機開了：產物放 .next-visual，不會蓋掉正式的 .next", async () => {
    const config = await loadConfig({ VISUAL_FIXTURE: "1", CI: "", VERCEL: "" });
    expect(config.distDir).toBe(".next-visual");
    expect(config.env?.VISUAL_FIXTURE_BUILD).toBe("1");
  });

  it.each([{ CI: "true", VERCEL: "" }, { CI: "", VERCEL: "1" }])("CI／Vercel 上開了直接拒絕（%o）", async (env) => {
    await expect(loadConfig({ VISUAL_FIXTURE: "1", ...env })).rejects.toThrow(/VISUAL_FIXTURE/);
  });

  it("環境裡直接設 VISUAL_FIXTURE_BUILD（繞過 VISUAL_FIXTURE）也拒絕", async () => {
    await expect(loadConfig({ VISUAL_FIXTURE: "", CI: "", VERCEL: "", VISUAL_FIXTURE_BUILD: "1" })).rejects.toThrow(
      /VISUAL_FIXTURE_BUILD/,
    );
  });
});
