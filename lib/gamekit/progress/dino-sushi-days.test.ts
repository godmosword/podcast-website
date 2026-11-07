import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveDinoSushiStickerState } from "./dino-sushi-stickers";
import { emptyDayFlags, withDayFlags } from "@/lib/games/dino-sushi/day-progress";
import { loadDinoSushiDays, saveDinoSushiDays } from "./dino-sushi-days";
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

const round = (day: number, flags: number) => withDayFlags(emptyDayFlags(), day, flags);

describe("壽司屋八天存檔", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockLocalStorage();
  });

  it("舊檔沒有欄位就是八個 0；星星只加不減；第 4 天不寫進來", () => {
    expect(loadDinoSushiDays()).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    saveDinoSushiDays(round(1, 1));
    saveDinoSushiDays(round(1, 7));
    saveDinoSushiDays(round(1, 1));
    expect(loadDinoSushiDays()[0]).toBe(7);
    saveDinoSushiDays(round(4, 7));
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
    saveDinoSushiDays(round(2, 1));
    const settings = loadGameKitSettings();
    saveGameKitSettings({ ...settings, gameVolume: 0.4 });
    expect(loadDinoSushiDays()[1]).toBe(1);
    const raw = JSON.parse(localStorage.getItem("cheche:progress") ?? "{}") as {
      preferences: { gameKit: { dinoSushiStickers: string[]; dinoSushiDays: number[] } };
    };
    expect(raw.preferences.gameKit.dinoSushiStickers).toContain("mood-love");
    expect(raw.preferences.gameKit.dinoSushiDays[1]).toBe(1);
  });

  it("寫不進去不丟例外：回報 ok:false，算好的結果交給呼叫端，存檔不變", () => {
    saveDinoSushiDays(round(1, 1));
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const write = saveDinoSushiDays(round(2, 3));
    expect(write.ok).toBe(false);
    expect(write.days.slice(0, 2)).toEqual([1, 3]);
    setItem.mockRestore();
    expect(loadDinoSushiDays().slice(0, 2)).toEqual([1, 0]);
  });

  it("恢復之後同一份再寫一次就存進去", () => {
    const pending = round(1, 7);
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(saveDinoSushiDays(pending).ok).toBe(false);
    setItem.mockRestore();
    expect(saveDinoSushiDays(pending)).toMatchObject({ ok: true });
    expect(loadDinoSushiDays()[0]).toBe(7);
  });

  it("沒有新東西要寫時不碰存檔，壞掉的 localStorage 也算成功", () => {
    saveDinoSushiDays(round(1, 1));
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(saveDinoSushiDays(round(1, 1)).ok).toBe(true);
    expect(saveDinoSushiDays(emptyDayFlags()).ok).toBe(true);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
