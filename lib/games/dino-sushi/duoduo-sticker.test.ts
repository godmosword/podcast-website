import { describe, expect, it } from "vitest";
import {
  DUODUO_STICKER_STATES,
  DUODUO_TOOTHBRUSH_SRC,
  duoduoStickerSrc,
  STICKER_FIT,
  STICKER_GROUND,
  stickerFor,
} from "./duoduo-sticker";

describe("多多貼紙對應", () => {
  it("待機是閉著的嘴", () => {
    expect(stickerFor("closed", "idle")).toBe("closed");
  });

  it("張嘴和咀嚼比好吃的表情優先", () => {
    expect(stickerFor("open", "idle")).toBe("open");
    expect(stickerFor("open", "yum")).toBe("open");
    expect(stickerFor("chew", "yum")).toBe("chew");
  });

  it("反應用表情貼紙；芥末改成噴火，不再用白煙 puff", () => {
    expect(stickerFor("closed", "love")).toBe("love");
    expect(stickerFor("closed", "yum")).toBe("yum");
    expect(stickerFor("closed", "sweet")).toBe("sweet");
    expect(stickerFor("closed", "look")).toBe("look");
    expect(stickerFor("laugh", "puff")).toBe("fire");
    expect(stickerFor("closed", "puff")).toBe("fire");
  });

  it("只有笑嘴、沒有別的表情時用 laugh", () => {
    expect(stickerFor("laugh", "idle")).toBe("laugh");
  });

  it("每一張貼紙都有對應的檔名", () => {
    expect([...DUODUO_STICKER_STATES]).toEqual([
      "closed",
      "open",
      "chew",
      "laugh",
      "love",
      "yum",
      "sweet",
      "fire",
      "look",
    ]);
  });

  it("貼紙與牙刷都讀縮小副本", () => {
    expect(duoduoStickerSrc("open")).toBe("/games/v2/dino-sushi/duoduo/sm/sticker-open.webp");
    expect(DUODUO_TOOTHBRUSH_SRC).toBe("/games/v2/dino-sushi/duoduo/sm/sticker-toothbrush.webp");
  });
});

describe("貼紙對齊（換表情不上下沉浮）", () => {
  it("每一張都有對齊值", () => {
    for (const state of DUODUO_STICKER_STATES) expect(STICKER_FIT[state], state).toBeDefined();
  });

  it("繞輪底縮放、再上下移：每張的輪底都落在畫布 92%（誤差 1/1024）", () => {
    expect(STICKER_GROUND).toBeCloseTo(942 / 1024, 6);
    for (const state of DUODUO_STICKER_STATES) {
      const { wheel, ty } = STICKER_FIT[state];
      expect(Math.abs(wheel + ty - STICKER_GROUND), state).toBeLessThanOrEqual(1 / 1024);
    }
  });

  it("縮放夾在 0.95–1.05（甜點不能看起來比最愛還興奮）；不做水平平移", () => {
    for (const state of DUODUO_STICKER_STATES) {
      const fit = STICKER_FIT[state];
      expect(fit.scale, state).toBeGreaterThanOrEqual(0.95);
      expect(fit.scale, state).toBeLessThanOrEqual(1.05);
      expect(Object.keys(fit).sort(), state).toEqual(["cx", "scale", "ty", "wheel"]);
    }
  });

  it("噴火只對齊輪底：車身偏左留給火焰，不縮放", () => {
    expect(STICKER_FIT.fire.scale).toBe(1);
  });
});
