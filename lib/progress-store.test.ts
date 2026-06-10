import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PROGRESS,
  getBestScoreFromStore,
  getFavoritesFromStore,
  getProgressSync,
  loadContinueFromStore,
  migrateProgress,
  saveBestScoreInStore,
  toggleFavoriteInStore,
} from "./progress-store";

function mockLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  });
  return store;
}

describe("progress-store migration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    mockLocalStorage();
  });

  it("migrates legacy favorites and continue", () => {
    localStorage.setItem("chechecar-favorites", JSON.stringify(["ambulance"]));
    localStorage.setItem(
      "chechecar-continue",
      JSON.stringify({
        slug: "ev",
        page: 2,
        time: 30,
        updatedAt: 1,
      }),
    );

    migrateProgress();

    expect(getFavoritesFromStore()).toEqual(["ambulance"]);
    expect(loadContinueFromStore()?.slug).toBe("ev");
    expect(localStorage.getItem("chechecar-favorites")).toBeNull();
    expect(localStorage.getItem("chechecar-continue")).toBeNull();
    expect(localStorage.getItem("cheche:progress")).toBeTruthy();
  });

  it("migrates legacy best scores taking max", () => {
    localStorage.setItem("block-drop-best", "1200");
    localStorage.setItem(
      "cheche:gamekit-profile",
      JSON.stringify({
        version: 2,
        stars: 0,
        unlockedVehicles: ["小黃"],
        bests: { "block-drop": 800 },
        medals: {},
        stickers: [],
        gamesPlayed: {},
      }),
    );

    migrateProgress();

    expect(getBestScoreFromStore("block-drop")).toBe(1200);
    expect(localStorage.getItem("block-drop-best")).toBeNull();
  });

  it("toggleFavorite updates store", () => {
    migrateProgress();
    const next = toggleFavoriteInStore("drone");
    expect(next).toEqual(["drone"]);
    expect(getFavoritesFromStore()).toEqual(["drone"]);
  });

  it("saveBestScore only increases", () => {
    migrateProgress();
    expect(saveBestScoreInStore("car-adventure", 100)).toBe(100);
    expect(saveBestScoreInStore("car-adventure", 50)).toBe(100);
    expect(getBestScoreFromStore("car-adventure")).toBe(100);
  });

  it("returns default on server", async () => {
    vi.stubGlobal("window", undefined);
    const { getProgress } = await import("./progress-store");
    const p = await getProgress();
    expect(p.favorites).toEqual(DEFAULT_PROGRESS.favorites);
  });
});

describe("getProgressSync", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockLocalStorage();
    migrateProgress();
  });

  it("has schemaVersion", () => {
    expect(getProgressSync().schemaVersion).toBe(1);
  });
});
