import { describe, expect, it } from "vitest";
import { resultFitScroll, stageRevealScroll, trayRevealScroll } from "./useRevealTray";

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

describe("送出時多多的臉有沒有被抬頭蓋住", () => {
  it("頭頂在抬頭下面：不捲", () => {
    expect(stageRevealScroll({ duoTop: 120, duoHeight: 100, headerBottom: 80 })).toBe(0);
  });

  it("只被蓋一點（透明留邊、8px 內）：不捲，每單少晃一次", () => {
    expect(stageRevealScroll({ duoTop: 62, duoHeight: 100, headerBottom: 80 })).toBe(0);
  });

  it("被蓋住：往上捲到頭頂在抬頭下 4px", () => {
    // 頭頂 15 + 11.7 = 26.7，抬頭底 72，要往下移 45.3 + 4
    expect(stageRevealScroll({ duoTop: 15, duoHeight: 117, headerBottom: 72 })).toBe(-50);
  });
});

describe("結算出現時怎麼捲，一屏才放得下", () => {
  const base = { viewportBottom: 568, headerBottom: 52 };

  it("書鈕和標題都看得到：不捲", () => {
    expect(resultFitScroll({ ...base, bookBottom: 500, titleTop: 80 })).toBe(0);
  });

  it("書鈕超出：往下捲到書鈕底離螢幕底 8px", () => {
    expect(resultFitScroll({ ...base, bookBottom: 572, titleTop: 120 })).toBe(12);
  });

  it("往下捲不能把標題捲進抬頭底下", () => {
    expect(resultFitScroll({ ...base, bookBottom: 640, titleTop: 80 })).toBe(24);
  });

  it("標題被抬頭蓋住、書鈕還有空間：往上捲", () => {
    expect(resultFitScroll({ ...base, bookBottom: 500, titleTop: 30 })).toBe(-26);
  });

  it("標題被蓋住但書鈕沒空間：只捲到書鈕還留得住", () => {
    expect(resultFitScroll({ ...base, bookBottom: 550, titleTop: 30 })).toBe(-10);
  });

  it("標題被蓋住、書鈕也超出：不動", () => {
    expect(resultFitScroll({ ...base, bookBottom: 600, titleTop: 30 })).toBe(0);
  });
});
