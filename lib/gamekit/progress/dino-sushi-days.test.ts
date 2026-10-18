import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveDinoSushiStickerState } from "./dino-sushi-stickers";
import { loadDinoSushiDays, saveDinoSushiDayFlags } from "./dino-sushi-days";
import { loadGameKitSettings, saveGameKitSettings } from "./settings";

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
  vi.stubGlobal(
    "CustomEvent",
    class {
      constructor(
        readonly type: string,
        readonly init?: unknown,
      ) {}
    },
  );
}

describe("壽司屋八天存檔", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockLocalStorage();
  });

  it("舊檔沒有欄位就是八個 0；星星只加不減；第 4 天不寫進來", () => {
    expect(loadDinoSushiDays()).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    saveDinoSushiDayFlags(1, 1);
    saveDinoSushiDayFlags(1, 7);
    saveDinoSushiDayFlags(1, 1);
    expect(loadDinoSushiDays()[0]).toBe(7);
    saveDinoSushiDayFlags(4, 7);
    expect(loadDinoSushiDays()[3]).toBe(0);
  });

  it("記星星不會清掉貼紙，改遊戲設定也不會清掉天數", () => {
    saveDinoSushiStickerState({
      unlocked: ["mood-love"],
      seen: [],
      fresh: ["mood-love"],
      roundKey: "round-1",
      gift: "",
    });
    saveDinoSushiDayFlags(2, 1);
    const settings = loadGameKitSettings();
    saveGameKitSettings({ ...settings, gameVolume: 0.4 });
    expect(loadDinoSushiDays()[1]).toBe(1);
    const raw = JSON.parse(localStorage.getItem("cheche:progress") ?? "{}") as {
      preferences: { gameKit: { dinoSushiStickers: string[]; dinoSushiDays: number[] } };
    };
    expect(raw.preferences.gameKit.dinoSushiStickers).toContain("mood-love");
    expect(raw.preferences.gameKit.dinoSushiDays[1]).toBe(1);
  });
});
