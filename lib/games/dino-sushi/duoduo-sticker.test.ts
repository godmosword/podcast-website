import { describe, expect, it } from "vitest";
import { DUODUO_STICKER_STATES, DUODUO_TOOTHBRUSH_SRC, duoduoStickerSrc, stickerFor } from "./duoduo-sticker";

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
