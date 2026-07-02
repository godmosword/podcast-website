import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

describe("trackPlatformClick", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
  });

  it("records local engagement and fires analytics event", async () => {
    const { track } = await import("@vercel/analytics");
    const { migrateProgress } = await import("./progress-store");
    const { trackPlatformClick } = await import("./analytics");

    migrateProgress();
    trackPlatformClick("Spotify", "story-platforms");

    const { getEngagementMetrics } = await import("./engagement");
    expect(getEngagementMetrics().platformClicks.Spotify).toBe(1);
    expect(track).toHaveBeenCalledWith("platform_click", {
      platform: "Spotify",
      source: "story-platforms",
    });
  });
});

describe("universe analytics", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { track } = await import("@vercel/analytics");
    vi.mocked(track).mockClear();
  });

  it("trackUniverseZoneTap 不含 PII", async () => {
    const { track } = await import("@vercel/analytics");
    const { trackUniverseZoneTap } = await import("./analytics");

    trackUniverseZoneTap("dino", "building");

    expect(track).toHaveBeenCalledWith("universe_zone_tap", {
      zoneId: "dino",
      status: "building",
    });
    const payload = vi.mocked(track).mock.calls[0]?.[1];
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("nickname");
  });

  it("trackUniverseWishSubmit 只送 hasEmail 布林", async () => {
    const { track } = await import("@vercel/analytics");
    const { trackUniverseWishSubmit } = await import("./analytics");

    trackUniverseWishSubmit("ocean", true);

    expect(track).toHaveBeenCalledWith("universe_wish_submit", {
      zoneId: "ocean",
      hasEmail: true,
    });
  });

  it("trackUniverseDayNightToggle 送 to 主題", async () => {
    const { track } = await import("@vercel/analytics");
    const { trackUniverseDayNightToggle } = await import("./analytics");

    trackUniverseDayNightToggle("night");

    expect(track).toHaveBeenCalledWith("universe_daynight_toggle", { to: "night" });
  });
});
