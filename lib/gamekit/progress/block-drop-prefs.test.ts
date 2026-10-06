import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadBlockDropPrefs,
  resolveBlockDropMode,
  saveBlockDropMode,
  saveBlockDropTips,
} from "@/lib/gamekit/progress/block-drop-prefs";
import { loadGameKitSettings, saveGameKitSettings } from "@/lib/gamekit/progress/settings";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress-store";

const LEGACY = "cheche:block-drop-tutorial-v1";

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
  vi.stubGlobal("CustomEvent", class {
    constructor(readonly type: string, readonly init?: unknown) {}
  });
  return store;
}

describe("繽紛樂園偏好", () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = mockLocalStorage();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("沒選過玩法時兒童模式＝輕鬆冒險；選了就沿用，不改其他遊戲設定", () => {
    expect(loadBlockDropPrefs().mode).toBeNull();
    expect(resolveBlockDropMode(null, true)).toBe("easy");
    expect(resolveBlockDropMode(null, false)).toBe("challenge");
    const before = loadGameKitSettings();
    saveBlockDropMode("free");
    expect(loadBlockDropPrefs().mode).toBe("free");
    expect(loadGameKitSettings().kidsMode).toBe(before.kidsMode);
    saveGameKitSettings({ ...loadGameKitSettings(), blockDropDifficulty: "standard" });
    expect(loadBlockDropPrefs().mode).toBe("free");
  });

  it("舊教學 key 與新欄位取聯集寫回；舊 key 保留；重複讀取不丟失", () => {
    store.set(LEGACY, JSON.stringify({ move: true, rotate: false, line: true }));
    saveBlockDropTips(["rotate"]);
    expect(loadBlockDropPrefs().tips).toEqual(["move", "rotate", "line"]);
    expect(store.get(LEGACY)).toBeTruthy();
    expect(loadBlockDropPrefs().tips).toEqual(["move", "rotate", "line"]);
    const raw = JSON.parse(store.get(PROGRESS_STORAGE_KEY) ?? "{}");
    expect(raw.preferences.gameKit.blockDropTips).toEqual(["move", "rotate", "line"]);
  });

  it("舊 key 是壞資料時視為未看過，但不清掉新欄位；新欄位壞值正規化", () => {
    saveBlockDropTips(["move"]);
    store.set(LEGACY, "{not json");
    expect(loadBlockDropPrefs().tips).toEqual(["move"]);
    const raw = JSON.parse(store.get(PROGRESS_STORAGE_KEY) ?? "{}");
    raw.preferences.gameKit.blockDropTips = ["line", "bogus"];
    raw.preferences.gameKit.blockDropMode = "hard";
    store.set(PROGRESS_STORAGE_KEY, JSON.stringify(raw));
    expect(loadBlockDropPrefs()).toEqual({ mode: null, tips: ["line"] });
  });
});
