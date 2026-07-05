import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PROGRESS,
  getBestScoreFromStore,
  getFavoritesFromStore,
  getProgressSync,
  getThemeFromStore,
  loadContinueFromStore,
  migrateProgress,
  saveBestScoreInStore,
  setThemeInStore,
  toggleFavoriteInStore,
} from "./progress-store";

function mockLocalStorage() {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    localStorage: localStorageMock,
  });
  vi.stubGlobal("localStorage", localStorageMock);
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

    expect(getFavoritesFromStore()).toEqual(["ep-6"]);
    expect(loadContinueFromStore()?.slug).toBe("ep-1");
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
    const next = toggleFavoriteInStore("ep-2");
    expect(next).toEqual(["ep-2"]);
    expect(getFavoritesFromStore()).toEqual(["ep-2"]);
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

  it("does not touch Node localStorage accessor on server", () => {
    vi.unstubAllGlobals();
    const originalLocalStorage = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage",
    );
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("server localStorage accessor was touched");
      },
    });

    try {
      expect(getProgressSync().favorites).toEqual(DEFAULT_PROGRESS.favorites);
    } finally {
      if (originalLocalStorage) {
        Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
      } else {
        Reflect.deleteProperty(globalThis, "localStorage");
      }
    }
  });
});

describe("getProgressSync", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockLocalStorage();
    migrateProgress();
  });

  it("has schemaVersion 2 with engagement", () => {
    const p = getProgressSync();
    expect(p.schemaVersion).toBe(2);
    expect(p.engagement.storiesCompleted).toEqual([]);
  });

  it("defaults theme to system and persists mode preference", () => {
    expect(getThemeFromStore()).toBe("system");
    setThemeInStore("night");
    expect(getThemeFromStore()).toBe("night");
    expect(getProgressSync().preferences.theme).toBe("night");
    setThemeInStore("system");
    expect(getThemeFromStore()).toBe("system");
  });

  it("strips legacy engagement tap fields on normalize", () => {
    const legacyEngagement = {
      storiesCompleted: ["ep-8"],
      reflectionShown: [] as string[],
      platformClicks: {} as Record<string, number>,
    };
    Object.assign(legacyEngagement, {
      [["hot", "spot", "Taps"].join("")]: 12,
      [["hot", "spot", "Ids"].join("")]: { "ep-9:wheels": 3 },
    });

    localStorage.setItem(
      "cheche:progress",
      JSON.stringify({
        schemaVersion: 2,
        favorites: [],
        continue: null,
        sfxEnabled: true,
        preferences: { captionSize: "md", gameKit: { kidsMode: true }, theme: "light" },
        bestScores: {},
        gameProfile: {
          version: 2,
          stars: 0,
          unlockedVehicles: ["小黃"],
          bests: {},
          medals: {},
          stickers: [],
          gamesPlayed: {},
        },
        unlocks: { characters: [], vehicles: [] },
        engagement: legacyEngagement,
      }),
    );

    const p = migrateProgress();
    expect(p.engagement).toEqual({
      storiesCompleted: ["ep-8"],
      reflectionShown: [],
      platformClicks: {},
    });
    expect(Object.keys(p.engagement).sort()).toEqual(
      ["platformClicks", "reflectionShown", "storiesCompleted"].sort(),
    );
  });
});

describe("progress-store v1 to v2 migration", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockLocalStorage();
  });

  it("upgrades v1 store with engagement defaults", () => {
    localStorage.setItem(
      "cheche:progress",
      JSON.stringify({
        schemaVersion: 1,
        favorites: [],
        continue: null,
        sfxEnabled: true,
        preferences: {
          captionSize: "md",
          gameKit: { kidsMode: true },
        },
        bestScores: {},
        gameProfile: {
          version: 2,
          stars: 0,
          unlockedVehicles: ["小黃"],
          bests: {},
          medals: {},
          stickers: [],
          gamesPlayed: {},
        },
        unlocks: { characters: [], vehicles: [] },
      }),
    );

    const migrated = migrateProgress();
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.engagement).toEqual({
      storiesCompleted: [],
      reflectionShown: [],
      platformClicks: {},
    });
  });
});
