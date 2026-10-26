import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadOrangeExpressLevel,
  resolveOrangeExpressLevel,
  saveOrangeExpressLevel,
} from "@/lib/gamekit/progress/orange-express-prefs";
import {
  PROGRESS_STORAGE_KEY,
  getGameKitSettingsFromStore,
  saveGameKitSettingsToStore,
} from "@/lib/progress-store";

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
}

describe("小橘特快車難度偏好", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("沒有這個欄位時：兒童模式是慢慢看，關掉是自己開，不改消消樂", () => {
    saveGameKitSettingsToStore({ candyMatchMode: "challenge" });
    const raw = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}") as {
      preferences: { gameKit: { orangeExpressLevel?: string; candyMatchMode?: string } };
    };
    delete raw.preferences.gameKit.orangeExpressLevel;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(raw));

    expect(loadOrangeExpressLevel()).toBeNull();
    expect(resolveOrangeExpressLevel(null, true)).toBe("look");
    expect(resolveOrangeExpressLevel(null, false)).toBe("drive");
    expect(getGameKitSettingsFromStore().candyMatchMode).toBe("challenge");
  });

  it("存小站長不會改掉消消樂，也不會被兒童模式蓋掉", () => {
    saveGameKitSettingsToStore({ candyMatchMode: "easy" });
    saveOrangeExpressLevel("captain");
    expect(loadOrangeExpressLevel()).toBe("captain");
    expect(resolveOrangeExpressLevel("captain", true)).toBe("captain");
    expect(getGameKitSettingsFromStore().candyMatchMode).toBe("easy");
  });
});
