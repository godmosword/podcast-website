import { describe, expect, it } from "vitest";
import { kartScoreFromTotalMs } from "./candy-kart-bridge";

describe("iframe-bridge", () => {
  it("kartScoreFromTotalMs 時間越短分數越高", () => {
    expect(kartScoreFromTotalMs(50_000)).toBe(20);
    expect(kartScoreFromTotalMs(25_000)).toBe(40);
    expect(kartScoreFromTotalMs(0)).toBe(0);
  });
});
