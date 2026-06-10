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
