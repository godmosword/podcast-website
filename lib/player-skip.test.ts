import { describe, expect, it } from "vitest";
import {
  illustrationIndexAt,
  illustrationSkipTarget,
  illustrationStartTimes,
} from "./player-skip";

const EP3_TIMES = [
  0, 20, 42.4, 58.4, 78.6, 99.7, 116.1, 136.5, 146.3, 168.8, 189.9, 213.2,
  223.3, 250.5, 271.5, 279.4, 301.2, 309.2, 329.2,
];

describe("illustrationStartTimes", () => {
  it("對齊的 captionTimes 原樣使用", () => {
    expect(
      illustrationStartTimes({
        pageCount: 3,
        captionTimes: [0, 12, 24],
        duration: 36,
      }),
    ).toEqual([0, 12, 24]);
  });

  it("無 captionTimes 時依時長等分", () => {
    expect(
      illustrationStartTimes({ pageCount: 4, duration: 40 }),
    ).toEqual([0, 10, 20, 30]);
  });

  it("單張封面維持 [0]", () => {
    expect(
      illustrationStartTimes({ pageCount: 1, duration: 180, captionTimes: [0] }),
    ).toEqual([0]);
  });
});

describe("illustrationSkipTarget", () => {
  const base = {
    duration: 350,
    pageCount: EP3_TIMES.length,
    captionTimes: EP3_TIMES,
  };

  it("快進跳到下一張插圖起點", () => {
    expect(
      illustrationSkipTarget({ ...base, currentTime: 0, direction: 1 }),
    ).toBe(20);
    expect(
      illustrationSkipTarget({ ...base, currentTime: 20, direction: 1 }),
    ).toBe(42.4);
    expect(
      illustrationSkipTarget({ ...base, currentTime: 25, direction: 1 }),
    ).toBe(42.4);
  });

  it("倒退回到上一張插圖起點", () => {
    expect(
      illustrationSkipTarget({ ...base, currentTime: 25, direction: -1 }),
    ).toBe(0);
    expect(
      illustrationSkipTarget({ ...base, currentTime: 42.4, direction: -1 }),
    ).toBe(20);
  });

  it("第一張倒退回到開頭", () => {
    expect(
      illustrationSkipTarget({ ...base, currentTime: 8, direction: -1 }),
    ).toBe(0);
    expect(
      illustrationSkipTarget({ ...base, currentTime: 0, direction: -1 }),
    ).toBe(0);
  });

  it("最後一張再快進維持原時間", () => {
    expect(
      illustrationSkipTarget({
        ...base,
        currentTime: 330,
        direction: 1,
      }),
    ).toBe(330);
  });

  it("MVP 單圖快進不移動、倒退回 0", () => {
    expect(
      illustrationSkipTarget({
        currentTime: 40,
        duration: 180,
        pageCount: 1,
        captionTimes: [0],
        direction: 1,
      }),
    ).toBe(40);
    expect(
      illustrationSkipTarget({
        currentTime: 40,
        duration: 180,
        pageCount: 1,
        direction: -1,
      }),
    ).toBe(0);
  });

  it("無 captionTimes 時用等分換頁", () => {
    expect(
      illustrationSkipTarget({
        currentTime: 5,
        duration: 40,
        pageCount: 4,
        direction: 1,
      }),
    ).toBe(10);
    expect(
      illustrationSkipTarget({
        currentTime: 22,
        duration: 40,
        pageCount: 4,
        direction: -1,
      }),
    ).toBe(10);
  });
});

describe("illustrationIndexAt", () => {
  it("對應目前時間所在的插圖索引", () => {
    expect(illustrationIndexAt(EP3_TIMES, 0)).toBe(0);
    expect(illustrationIndexAt(EP3_TIMES, 20)).toBe(1);
    expect(illustrationIndexAt(EP3_TIMES, 41)).toBe(1);
    expect(illustrationIndexAt(EP3_TIMES, 42.4)).toBe(2);
  });
});
