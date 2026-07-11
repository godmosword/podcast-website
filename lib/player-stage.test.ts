import { describe, expect, it } from "vitest";
import { shouldRunKenBurns } from "./player-stage";

describe("shouldRunKenBurns", () => {
  const base = {
    isPlaying: true,
    pageVisible: true,
    hasEnded: false,
    isLoading: false,
    prefersReducedMotion: false,
  };

  it("播放中且可見時啟動", () => {
    expect(shouldRunKenBurns(base)).toBe(true);
  });

  it("暫停時停止", () => {
    expect(shouldRunKenBurns({ ...base, isPlaying: false })).toBe(false);
  });

  it("背景分頁隱藏時停止", () => {
    expect(shouldRunKenBurns({ ...base, pageVisible: false })).toBe(false);
  });

  it("reduced-motion 時停止", () => {
    expect(shouldRunKenBurns({ ...base, prefersReducedMotion: true })).toBe(
      false,
    );
  });
});
