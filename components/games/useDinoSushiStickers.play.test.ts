// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { beginDinoSushiStickerRound, dinoSushiStickerPlayId } from "./useDinoSushiStickers";

describe("壽司屋貼紙分頁", () => {
  it("每一輪自己發 id，不讀 sessionStorage", () => {
    sessionStorage.setItem("dino-sushi-play", "copied-from-another-tab");
    const reads = { n: 0 };
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function getItem(this: Storage, key: string) {
      if (this === sessionStorage) reads.n += 1;
      return original.call(this, key);
    };
    try {
      const first = beginDinoSushiStickerRound();
      const second = beginDinoSushiStickerRound();
      expect(first).not.toBe(second);
      expect(first).not.toBe("copied-from-another-tab");
      expect(dinoSushiStickerPlayId()).toBe(second);
      expect(reads.n).toBe(0);
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});
