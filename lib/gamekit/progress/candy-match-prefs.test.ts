import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadCandyMatchPrefs,
  markCandyTipSeen,
  resolveCandyMode,
  saveCandyMatchChallengeUnlocked,
  saveCandyMatchMode,
} from "@/lib/gamekit/progress/candy-match-prefs";
import { loadGameKitSettings, saveGameKitSettings } from "@/lib/gamekit/progress/settings";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress-store";

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
}

describe("消消樂專用偏好", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("家長沒打開挑戰時一律輕鬆，打開後才沿用選擇", () => {
    expect(loadCandyMatchPrefs()).toEqual({ mode: null, tipsSeen: [], challengeUnlocked: false });
    expect(resolveCandyMode(null, false)).toBe("easy");
    expect(resolveCandyMode("challenge", false)).toBe("easy");
    expect(resolveCandyMode(null, true)).toBe("easy");
    expect(resolveCandyMode("easy", true)).toBe("easy");
    expect(resolveCandyMode("challenge", true)).toBe("challenge");
  });

  it("明確選擇後沿用，且不改其他遊戲的兒童模式", () => {
    const before = loadGameKitSettings();
    saveCandyMatchMode("challenge");
    saveCandyMatchChallengeUnlocked(true);
    expect(loadCandyMatchPrefs().mode).toBe("challenge");
    expect(loadCandyMatchPrefs().challengeUnlocked).toBe(true);
    expect(loadGameKitSettings().kidsMode).toBe(before.kidsMode);

    // 其他遊戲存設定時不會洗掉消消樂偏好
    saveGameKitSettings({ ...loadGameKitSettings(), blockDropDifficulty: "standard" });
    expect(loadCandyMatchPrefs().mode).toBe("challenge");
    expect(loadCandyMatchPrefs().challengeUnlocked).toBe(true);
  });

  it("關掉挑戰不刪已選的玩法，舊存檔缺欄位時維持鎖住", () => {
    loadCandyMatchPrefs();
    const raw = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}");
    raw.preferences.gameKit.candyMatchMode = "challenge";
    delete raw.preferences.gameKit.candyMatchChallengeUnlocked;
    raw.gameProfile = {
      ...(raw.gameProfile ?? {}),
      candyMatchMedals: { easy: [1], challenge: [7, 7] },
    };
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(raw));

    expect(loadCandyMatchPrefs()).toMatchObject({ mode: "challenge", challengeUnlocked: false });
    expect(resolveCandyMode("challenge", false)).toBe("easy");

    saveCandyMatchChallengeUnlocked(true);
    saveCandyMatchChallengeUnlocked(false);
    const after = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}");
    expect(after.preferences.gameKit.candyMatchMode).toBe("challenge");
    expect(after.preferences.gameKit.candyMatchChallengeUnlocked).toBe(false);
    expect(after.gameProfile.candyMatchMedals).toEqual({ easy: [1], challenge: [7, 7] });
  });

  it("首次引導只記一次；舊存檔或壞值正規化", () => {
    markCandyTipSeen("swap");
    markCandyTipSeen("swap");
    markCandyTipSeen("row");
    expect(loadCandyMatchPrefs().tipsSeen).toEqual(["swap", "row"]);

    const raw = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}");
    raw.preferences.gameKit.candyMatchMode = "hard";
    raw.preferences.gameKit.candyMatchTips = ["swap", "bogus", 3];
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(raw));
    expect(loadCandyMatchPrefs()).toEqual({ mode: null, tipsSeen: ["swap"], challengeUnlocked: false });
  });
});
