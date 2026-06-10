import { describe, expect, it } from "vitest";
import {
  isKartRaceFinishMessage,
  kartScoreFromTotalMs,
  KART_MESSAGE_SOURCE,
} from "./iframe-bridge";

describe("iframe-bridge", () => {
  it("isKartRaceFinishMessage 手寫 type guard", () => {
    expect(
      isKartRaceFinishMessage({
        source: KART_MESSAGE_SOURCE,
        type: "race-finish",
        playerPos: 1,
        totalMs: 50_000,
        bestLapMs: 12_000,
        trackId: "oval",
      }),
    ).toBe(true);
    expect(isKartRaceFinishMessage({ source: "other", type: "race-finish" })).toBe(false);
    expect(isKartRaceFinishMessage(null)).toBe(false);
  });

  it("kartScoreFromTotalMs 時間越短分數越高", () => {
    expect(kartScoreFromTotalMs(50_000)).toBe(20);
    expect(kartScoreFromTotalMs(25_000)).toBe(40);
    expect(kartScoreFromTotalMs(0)).toBe(0);
  });
});
