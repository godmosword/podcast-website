import { describe, expect, it } from "vitest";
import {
  candyKartSessionFromFinish,
  type CandyKartFinishMessage,
} from "./candy-kart-bridge";

describe("iframe-bridge", () => {
  it("finish 訊息映射分數：時間越短分數越高", () => {
    const base: CandyKartFinishMessage = {
      source: "cheche-candy-kart",
      type: "race-finish",
      trackId: "macaron-meadow",
      playerPos: 1,
      totalMs: 50_000,
      bestLapMs: 16_000,
      starsCollected: 7,
      starsTotal: 7,
    };
    expect(candyKartSessionFromFinish(base).score).toBe(20);
    expect(candyKartSessionFromFinish({ ...base, totalMs: 25_000 }).score).toBe(40);
    expect(candyKartSessionFromFinish({ ...base, totalMs: 0 }).score).toBe(0);
  });
});
