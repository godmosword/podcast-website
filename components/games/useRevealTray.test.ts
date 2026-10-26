import { describe, expect, it } from "vitest";
import { trayRevealScroll } from "./useRevealTray";

describe("選完飯往下捲多少才看得到托盤", () => {
  it("托盤本來就在畫面內：不捲", () => {
    expect(trayRevealScroll({ trayBottom: 652, viewportHeight: 664, talkTop: 172, headerBottom: 80 })).toBe(0);
    expect(trayRevealScroll({ trayBottom: 778, viewportHeight: 844, talkTop: 206, headerBottom: 80 })).toBe(0);
  });

  it("托盤超出、泡泡上方還有空間：捲到托盤底離螢幕底 8px", () => {
    // 320×568：要捲 652 + 8 − 568 = 92，泡泡頂 174 − 抬頭底 72 − 4 = 98 夠捲
    expect(trayRevealScroll({ trayBottom: 652, viewportHeight: 568, talkTop: 174, headerBottom: 72 })).toBe(92);
  });

  it("捲到底會把點餐泡泡捲進抬頭底下：只捲到泡泡頂端貼著抬頭下方 4px", () => {
    // 375×553：要捲 107，但泡泡頂 172 − 抬頭底 80 − 4 = 88
    expect(trayRevealScroll({ trayBottom: 652, viewportHeight: 553, talkTop: 172, headerBottom: 80 })).toBe(88);
  });

  it("泡泡已經貼著或躲在抬頭底下：不捲", () => {
    expect(trayRevealScroll({ trayBottom: 700, viewportHeight: 553, talkTop: 70, headerBottom: 80 })).toBe(0);
  });

  it("沒有泡泡（自由做、吃的時候）：只看托盤", () => {
    expect(trayRevealScroll({ trayBottom: 652, viewportHeight: 553, talkTop: null, headerBottom: 80 })).toBe(107);
  });
});
