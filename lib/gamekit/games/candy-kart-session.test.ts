import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  candyKartSessionFromFinish,
  isCandyKartFinishMessage,
  isCandyKartReadyMessage,
  type CandyKartFinishMessage,
} from "./candy-kart-bridge";
import {
  CANDY_KART_TRACKS,
  candyKartTrackById,
  grandPrixPointsForPosition,
} from "@/lib/games/candy-kart/tracks";
import { reportGameSession } from "../progress/session";

const validFinish: CandyKartFinishMessage = {
  source: "cheche-candy-kart",
  type: "race-finish",
  trackId: "macaron-meadow",
  playerPos: 1,
  totalMs: 200_000,
  bestLapMs: 64_000,
  starsCollected: 7,
  starsTotal: 7,
};

describe("candy-kart iframe bridge", () => {
  it("驗證合法 race-finish 訊息", () => {
    expect(isCandyKartFinishMessage(validFinish)).toBe(true);
  });

  it("拒絕錯誤 source／缺欄位／非法數值", () => {
    expect(isCandyKartFinishMessage(null)).toBe(false);
    expect(isCandyKartFinishMessage({})).toBe(false);
    expect(
      isCandyKartFinishMessage({ ...validFinish, source: "cheche-kart" }),
    ).toBe(false);
    expect(
      isCandyKartFinishMessage({ ...validFinish, playerPos: 0 }),
    ).toBe(false);
    expect(
      isCandyKartFinishMessage({ ...validFinish, totalMs: -1 }),
    ).toBe(false);
    expect(
      isCandyKartFinishMessage({ ...validFinish, totalMs: Infinity }),
    ).toBe(false);
    expect(
      isCandyKartFinishMessage({ ...validFinish, starsCollected: -2 }),
    ).toBe(false);
    const { starsTotal: omittedStarsTotal, ...missing } = validFinish;
    expect(omittedStarsTotal).toBe(validFinish.starsTotal);
    expect(isCandyKartFinishMessage(missing)).toBe(false);
  });

  it("驗證 ready 訊息", () => {
    expect(
      isCandyKartReadyMessage({
        source: "cheche-candy-kart",
        type: "ready",
      }),
    ).toBe(true);
    expect(
      isCandyKartReadyMessage({ source: "other", type: "ready" }),
    ).toBe(false);
    expect(isCandyKartReadyMessage(validFinish)).toBe(false);
  });
});

describe("candy-kart 三星／分數映射", () => {
  it("冠軍＋時間達標＋收齊星星 → 三星全亮", () => {
    const result = candyKartSessionFromFinish(validFinish);
    expect(result.gameId).toBe("candy-kart");
    expect(result.score).toBe(5);
    expect(result.levelIndex).toBe(0);
    expect(result.cleared).toBe(true);
    expect(result.flawless).toBe(true);
    expect(result.collectedAll).toBe(true);
  });

  it("第 4 名不算通關；超過 par 不算時間達標；缺星星不算全收集", () => {
    const result = candyKartSessionFromFinish({
      ...validFinish,
      playerPos: 4,
      totalMs: 300_000,
      starsCollected: 5,
    });
    expect(result.cleared).toBe(false);
    expect(result.flawless).toBe(false);
    expect(result.collectedAll).toBe(false);
  });

  it("第 3 名仍算通關（前 3 標準）", () => {
    expect(
      candyKartSessionFromFinish({ ...validFinish, playerPos: 3 }).cleared,
    ).toBe(true);
  });

  it("未知 trackId 仍回報分數，但不發獎牌欄位", () => {
    const result = candyKartSessionFromFinish({
      ...validFinish,
      trackId: "not-a-track",
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.levelIndex).toBeUndefined();
    expect(result.cleared).toBeUndefined();
  });
});

describe("candy-kart 賽道中繼資料", () => {
  it("至少 5 條賽道（需求門檻），目前 6 條", () => {
    expect(CANDY_KART_TRACKS.length).toBeGreaterThanOrEqual(5);
    expect(CANDY_KART_TRACKS.length).toBe(6);
  });

  it("levelIndex 連續且 id 唯一", () => {
    const ids = new Set(CANDY_KART_TRACKS.map((t) => t.id));
    expect(ids.size).toBe(CANDY_KART_TRACKS.length);
    CANDY_KART_TRACKS.forEach((t, i) => expect(t.levelIndex).toBe(i));
  });

  it("每條賽道 par 時間落在 3–5 分鐘區間", () => {
    for (const t of CANDY_KART_TRACKS) {
      expect(t.parTimeMs).toBeGreaterThanOrEqual(180_000);
      expect(t.parTimeMs).toBeLessThanOrEqual(300_000);
      expect(t.laps).toBeGreaterThanOrEqual(2);
      expect(t.starsTotal).toBeGreaterThan(0);
    }
  });

  it("candyKartTrackById 查得到／查不到", () => {
    expect(candyKartTrackById("jelly-forest")?.name).toBe("果凍森林");
    expect(candyKartTrackById("nope")).toBeNull();
  });

  it("大獎賽積分：1–8 名遞減，9 名以後 0 分", () => {
    expect(grandPrixPointsForPosition(1)).toBe(10);
    expect(grandPrixPointsForPosition(2)).toBe(8);
    expect(grandPrixPointsForPosition(8)).toBe(1);
    expect(grandPrixPointsForPosition(9)).toBe(0);
    expect(grandPrixPointsForPosition(0)).toBe(0);
    expect(grandPrixPointsForPosition(1.5)).toBe(0);
  });
});

describe("candy-kart gamekit 閉環", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reportGameSession 寫入 candy-kart 最佳分數與三星獎牌", () => {
    const profile = reportGameSession(candyKartSessionFromFinish(validFinish));
    expect(profile.bests["candy-kart"]).toBe(5);
    expect(profile.gamesPlayed["candy-kart"]).toBe(true);
    expect(profile.medals["candy-kart"]?.[0]).toBe(7); // 三星 bit flags
  });

  it("第 4 名只記分數，不發獎牌", () => {
    const profile = reportGameSession(
      candyKartSessionFromFinish({ ...validFinish, playerPos: 4 }),
    );
    expect(profile.bests["candy-kart"]).toBeGreaterThan(0);
    expect(profile.medals["candy-kart"]?.[0] ?? 0).toBe(0);
  });
});
