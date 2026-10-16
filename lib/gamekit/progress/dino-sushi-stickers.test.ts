import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DINO_SUSHI_STICKERS } from "@/lib/games/dino-sushi/stickers";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress-store";
import { loadGameKitSettings, saveGameKitSettings } from "@/lib/gamekit/progress/settings";
import { stickerLabel } from "@/lib/gamekit/progress/stickers";
import {
  DINO_SUSHI_BOOK_STICKER,
  addDinoSushiStickers,
  loadDinoSushiStickers,
  markDinoSushiStickersSeen,
  saveDinoSushiStickerState,
} from "./dino-sushi-stickers";

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
  return store;
}

describe("多多壽司屋貼紙存檔", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("沒有這個欄位、或欄位壞掉，當成一張都還沒有", () => {
    expect(loadDinoSushiStickers()).toEqual({
      unlocked: [],
      seen: [],
      fresh: [],
      roundKey: "",
      gift: "",
    });
    store.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        preferences: {
          gameKit: {
            kidsMode: true,
            dinoSushiStickers: "tamago",
            dinoSushiStickersSeen: { nope: true },
            dinoSushiStickerGift: "not-a-sticker",
          },
        },
      }),
    );
    expect(loadDinoSushiStickers().unlocked).toEqual([]);
    expect(loadDinoSushiStickers().gift).toBe("");
  });

  it("只留下認識的 id，看過但還沒拿到的不算", () => {
    store.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        preferences: {
          gameKit: {
            dinoSushiStickers: ["topping-tamago", "customer-nobody", 3, "topping-tamago", "base-nigiri"],
            dinoSushiStickersSeen: ["topping-tamago", "mood-love", "bogus"],
            dinoSushiStickersFresh: ["base-nigiri", "nope"],
          },
        },
      }),
    );
    expect(loadDinoSushiStickers()).toMatchObject({
      unlocked: ["topping-tamago", "base-nigiri"],
      seen: ["topping-tamago"],
      fresh: ["base-nigiri"],
    });
  });

  it("加貼紙不會清掉其他遊戲的進度，也不會收回已經有的", () => {
    store.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        favorites: ["ep-1"],
        bestScores: { "candy-match": 12 },
        preferences: {
          captionSize: "lg",
          theme: "night",
          gameKit: {
            kidsMode: false,
            gameVolume: 0.4,
            voiceEnabled: false,
            candyMatchMode: "easy",
            candyMatchTips: ["swap"],
            blockDropMode: "free",
            blockDropTips: ["move"],
          },
        },
        gameProfile: {
          stickers: ["played-candy-match"],
          bests: { "candy-match": 12 },
        },
      }),
    );
    const { added, state } = addDinoSushiStickers(["topping-corn", "not-real", "topping-corn"]);
    expect(added).toEqual(["topping-corn"]);
    expect(state.unlocked).toEqual(["topping-corn"]);
    const again = addDinoSushiStickers(["topping-shrimp"]);
    expect(again.state.unlocked).toEqual(["topping-corn", "topping-shrimp"]);

    const raw = JSON.parse(store.get(PROGRESS_STORAGE_KEY) ?? "{}");
    expect(raw.favorites).toEqual(["ep-1"]);
    expect(raw.bestScores["candy-match"]).toBe(12);
    expect(raw.preferences.captionSize).toBe("lg");
    expect(raw.preferences.theme).toBe("night");
    expect(raw.preferences.gameKit.kidsMode).toBe(false);
    expect(raw.preferences.gameKit.gameVolume).toBe(0.4);
    expect(raw.preferences.gameKit.voiceEnabled).toBe(false);
    expect(raw.preferences.gameKit.candyMatchMode).toBe("easy");
    expect(raw.preferences.gameKit.candyMatchTips).toEqual(["swap"]);
    expect(raw.preferences.gameKit.blockDropMode).toBe("free");
    expect(raw.preferences.gameKit.blockDropTips).toEqual(["move"]);
    expect(raw.preferences.gameKit.dinoSushiStickers).toEqual(["topping-corn", "topping-shrimp"]);
    expect(raw.gameProfile.stickers).toEqual(["played-candy-match"]);
    expect(raw.gameProfile.bests["candy-match"]).toBe(12);
  });

  it("遊戲設定另存時，貼紙還在", () => {
    addDinoSushiStickers(["mood-yum"]);
    saveGameKitSettings({ ...loadGameKitSettings(), voiceEnabled: false, gameVolume: 0.2 });
    expect(loadDinoSushiStickers().unlocked).toEqual(["mood-yum"]);
    expect(loadGameKitSettings().voiceEnabled).toBe(false);
    expect(loadGameKitSettings().gameVolume).toBe(0.2);
    expect(loadGameKitSettings().kidsMode).toBe(true);
  });

  it("看過的標記不會把貼紙收回", () => {
    addDinoSushiStickers(["topping-salmon", "base-temaki"]);
    const seen = markDinoSushiStickersSeen();
    expect(seen.unlocked).toEqual(["topping-salmon", "base-temaki"]);
    expect(seen.seen).toEqual(["topping-salmon", "base-temaki"]);
  });

  it("舊的 24 張 id 還讀得回來，客人 id 也留著，不認識的會拿掉", () => {
    const original = DINO_SUSHI_STICKERS.filter((sticker) => sticker.group !== "customer").map((sticker) => sticker.id);
    expect(original).toHaveLength(24);
    store.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        preferences: {
          gameKit: {
            dinoSushiStickers: [...original, "customer-xiaohong", "not-a-sticker"],
          },
        },
      }),
    );
    expect(loadDinoSushiStickers().unlocked).toEqual([...original, "customer-xiaohong"]);
  });

  it("收滿 30 張才加全站貼紙；只有舊的 24 張不會加，加過不重複", () => {
    const ids = DINO_SUSHI_STICKERS.map((s) => s.id);
    addDinoSushiStickers(ids.slice(0, 24));
    expect(JSON.parse(store.get(PROGRESS_STORAGE_KEY) ?? "{}").gameProfile?.stickers ?? []).not.toContain(
      DINO_SUSHI_BOOK_STICKER,
    );
    addDinoSushiStickers(ids.slice(24, 29));
    expect(JSON.parse(store.get(PROGRESS_STORAGE_KEY) ?? "{}").gameProfile?.stickers ?? []).not.toContain(
      DINO_SUSHI_BOOK_STICKER,
    );
    addDinoSushiStickers([ids[29]!]);
    const profile = JSON.parse(store.get(PROGRESS_STORAGE_KEY) ?? "{}").gameProfile;
    expect(profile.stickers.filter((id: string) => id === DINO_SUSHI_BOOK_STICKER)).toEqual([
      DINO_SUSHI_BOOK_STICKER,
    ]);
    expect(stickerLabel(DINO_SUSHI_BOOK_STICKER)).toBe("多多貼紙書收集完成");
    saveDinoSushiStickerState(loadDinoSushiStickers());
    const again = JSON.parse(store.get(PROGRESS_STORAGE_KEY) ?? "{}").gameProfile.stickers;
    expect(again.filter((id: string) => id === DINO_SUSHI_BOOK_STICKER)).toHaveLength(1);
  });

  it("以前用 24 張換到的收集完成還留著，不會因為改成 30 張被收回", () => {
    const original = DINO_SUSHI_STICKERS.filter((sticker) => sticker.group !== "customer").map((sticker) => sticker.id);
    store.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        preferences: { gameKit: { dinoSushiStickers: original } },
        gameProfile: { stickers: [DINO_SUSHI_BOOK_STICKER, "played-candy-match"], bests: {} },
      }),
    );
    saveDinoSushiStickerState(loadDinoSushiStickers());
    const profile = JSON.parse(store.get(PROGRESS_STORAGE_KEY) ?? "{}").gameProfile;
    expect(profile.stickers.filter((id: string) => id === DINO_SUSHI_BOOK_STICKER)).toEqual([
      DINO_SUSHI_BOOK_STICKER,
    ]);
    expect(profile.stickers).toContain("played-candy-match");
    expect(loadDinoSushiStickers().unlocked).toEqual(original);
  });
});
