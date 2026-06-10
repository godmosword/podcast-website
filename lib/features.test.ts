import { afterEach, describe, expect, it, vi } from "vitest";

describe("flag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadFeatures() {
    return import("./features");
  }

  it("未設環境變數時使用預設值", async () => {
    const { flag } = await loadFeatures();
    expect(flag("NIGHT_MODE", true)).toBe(true);
    expect(flag("NIGHT_MODE", false)).toBe(false);
  });

  it("1 / true 為開", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_NIGHT_MODE", "1");
    const { flag } = await loadFeatures();
    expect(flag("NIGHT_MODE", false)).toBe(true);

    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_FEATURE_NIGHT_MODE", "TRUE");
    const mod2 = await loadFeatures();
    expect(mod2.flag("NIGHT_MODE", false)).toBe(true);
  });

  it("0 / false 為關", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_NIGHT_MODE", "0");
    const { flag } = await loadFeatures();
    expect(flag("NIGHT_MODE", true)).toBe(false);

    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_FEATURE_NIGHT_MODE", "false");
    const mod2 = await loadFeatures();
    expect(mod2.flag("NIGHT_MODE", true)).toBe(false);
  });

  it("非法值回退預設", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_NIGHT_MODE", "maybe");
    const { flag } = await loadFeatures();
    expect(flag("NIGHT_MODE", true)).toBe(true);
    expect(flag("NIGHT_MODE", false)).toBe(false);
  });

  it("FEATURES 預設全開（goodnightButton 除外）", async () => {
    const { FEATURES } = await loadFeatures();
    expect(FEATURES.nightMode).toBe(true);
    expect(FEATURES.starterEpisodes).toBe(true);
    expect(FEATURES.reflectionPrompt).toBe(true);
    expect(FEATURES.goodnightButton).toBe(false);
  });
});
