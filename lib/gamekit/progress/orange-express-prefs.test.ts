import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ORANGE_EXPRESS_DISPLAY_EVENT,
  loadOrangeExpressDisplay,
  loadOrangeExpressLevel,
  resolveOrangeExpressDriver,
  resolveOrangeExpressLevel,
  saveOrangeExpressDisplay,
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

  it("舊存檔沒有顯示設定：不畫數字、會晃；改了會存起來並通知駕駛台", () => {
    saveGameKitSettingsToStore({ candyMatchMode: "easy" });
    const raw = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}") as {
      preferences: { gameKit: Record<string, unknown> };
    };
    delete raw.preferences.gameKit.orangeExpressGaugeNumbers;
    delete raw.preferences.gameKit.orangeExpressSway;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(raw));
    expect(loadOrangeExpressDisplay()).toEqual({ gaugeNumbers: false, sway: true, driver: null });

    const next = saveOrangeExpressDisplay({ gaugeNumbers: true, sway: false });
    expect(next).toEqual({ gaugeNumbers: true, sway: false, driver: null });
    expect(loadOrangeExpressDisplay()).toEqual({ gaugeNumbers: true, sway: false, driver: null });
    expect(getGameKitSettingsFromStore().candyMatchMode).toBe("easy");
    const dispatch = window.dispatchEvent as unknown as ReturnType<typeof vi.fn>;
    const types = dispatch.mock.calls.map(([event]) => (event as Event).type);
    expect(types).toContain(ORANGE_EXPRESS_DISPLAY_EVENT);
  });

  it("司機：舊存檔沒有＝依兒童模式；家長切了就照存的，不動其他設定", () => {
    saveGameKitSettingsToStore({ candyMatchMode: "easy", orangeExpressLevel: "drive" });
    const raw = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}") as {
      preferences: { gameKit: Record<string, unknown> };
    };
    delete raw.preferences.gameKit.orangeExpressDriver;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(raw));
    expect(loadOrangeExpressDisplay().driver).toBeNull();
    expect(resolveOrangeExpressDriver(null, true)).toBe("little");
    expect(resolveOrangeExpressDriver(null, false)).toBe("big");

    saveOrangeExpressDisplay({ driver: "big" });
    expect(loadOrangeExpressDisplay().driver).toBe("big");
    expect(resolveOrangeExpressDriver("big", true)).toBe("big");
    expect(getGameKitSettingsFromStore().orangeExpressLevel).toBe("drive");
    expect(getGameKitSettingsFromStore().candyMatchMode).toBe("easy");
    expect(loadOrangeExpressDisplay().sway).toBe(true);
  });

  it("司機欄位亂掉時回到未設定", () => {
    saveGameKitSettingsToStore({ candyMatchMode: "easy" });
    const raw = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}") as {
      preferences: { gameKit: Record<string, unknown> };
    };
    raw.preferences.gameKit.orangeExpressDriver = "rocket";
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(raw));
    expect(loadOrangeExpressDisplay().driver).toBeNull();
  });
});
