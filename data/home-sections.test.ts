import { afterEach, describe, expect, it, vi } from "vitest";

describe("home-sections", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load() {
    return import("./home-sections");
  }

  it("預設順序與現況首頁一致（不含 starter / subscribeBand）", async () => {
    const { activeHomeSectionIds } = await load();
    expect(activeHomeSectionIds()).toEqual([
      "continue",
      "latestHero",
      "favorites",
      "storyFilter",
    ]);
  });

  it("starter 在 registry enabled 且 flag 開啟時才出現", async () => {
    const mod = await load();
    const starter = mod.HOME_SECTIONS.find((s) => s.id === "starter")!;
    expect(mod.isHomeSectionActive({ ...starter, enabled: false })).toBe(false);
    expect(mod.isHomeSectionActive({ ...starter, enabled: true })).toBe(true);
  });

  it("starter flag 關閉時不渲染", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_STARTER_EPISODES", "0");
    vi.resetModules();
    const mod = await load();
    const starter = mod.HOME_SECTIONS.find((s) => s.id === "starter")!;
    expect(mod.isHomeSectionActive({ ...starter, enabled: true })).toBe(false);
  });
});
