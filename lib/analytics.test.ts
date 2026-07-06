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

describe("trackStoryCompleted（完播口徑）", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    };
    // isClient() 檢查 window.localStorage，stub 需同時掛在 window 上
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      localStorage: localStorageMock,
    });
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("CustomEvent", class extends Event {});
  });

  it("每次完播送事件；本機 storiesCompleted 去重只記一次", async () => {
    const { track } = await import("@vercel/analytics");
    vi.mocked(track).mockClear();
    const { migrateProgress, getProgressSync } = await import("./progress-store");
    const { trackStoryCompleted } = await import("./analytics");

    migrateProgress();
    trackStoryCompleted("ep-3");
    trackStoryCompleted("ep-3"); // replay 後再聽完
    await new Promise((resolve) => setTimeout(resolve, 0)); // updateProgress 為 async 寫入

    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledWith("story_completed", { slug: "ep-3" });
    expect(
      getProgressSync().engagement.storiesCompleted.filter((s) => s === "ep-3"),
    ).toHaveLength(1);
  });

  it("payload 只含 slug，無時間戳與 PII", async () => {
    const { track } = await import("@vercel/analytics");
    vi.mocked(track).mockClear();
    const { migrateProgress } = await import("./progress-store");
    const { trackStoryCompleted } = await import("./analytics");

    migrateProgress();
    trackStoryCompleted("ep-1");

    const payload = vi.mocked(track).mock.calls[0]?.[1];
    expect(Object.keys(payload ?? {})).toEqual(["slug"]);
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

  it("trackWishSubmitted 只送 category，不含 PII", async () => {
    const { track } = await import("@vercel/analytics");
    const { trackWishSubmitted } = await import("./analytics");

    trackWishSubmitted("story");

    expect(track).toHaveBeenCalledWith("wish_submitted", { category: "story" });
    const payload = vi.mocked(track).mock.calls[0]?.[1];
    expect(payload).not.toHaveProperty("message");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("nickname");
  });

  it("trackUniverseDayNightToggle 送 to 主題", async () => {
    const { track } = await import("@vercel/analytics");
    const { trackUniverseDayNightToggle } = await import("./analytics");

    trackUniverseDayNightToggle("night");

    expect(track).toHaveBeenCalledWith("universe_daynight_toggle", { to: "night" });
  });
});
