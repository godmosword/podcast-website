import { describe, expect, test } from "vitest";
import {
  clipParentVoice,
  composeParentBlurb,
  formatVerifiedMonthLabel,
} from "./playground-parent-voice";

describe("composeParentBlurb", () => {
  test("先呈現 tips，再補充未重複的設施", () => {
    const blurb = composeParentBlurb({
      tips: "適合傍晚去，先找有遮蔭的遊具區。",
      facilities: ["洗手間"],
      free: true,
      indoor: false,
    });

    expect(blurb.startsWith("適合傍晚去")).toBe(true);
    expect(blurb).toContain("有洗手間");
  });

  test("tips 已含設施時不重複前綴", () => {
    const blurb = composeParentBlurb({
      tips: "太陽大時優先找遮蔭區；假日建議傍晚去。",
      facilities: ["遮蔭區", "洗手間"],
      free: true,
      indoor: false,
    });
    expect(blurb).toContain("遮蔭區");
    expect(blurb.startsWith("有遮蔭區")).toBe(false);
    expect(blurb).toContain("有洗手間");
  });

  test("只陳述資料裡的設施，不發明超商", () => {
    const blurb = composeParentBlurb({
      tips: "遊戲場與跑道分開，適合先跑再玩。",
      facilities: ["兒童遊戲場", "停車場"],
      free: true,
      indoor: false,
    });
    expect(blurb).toContain("兒童遊戲場");
    expect(blurb).toContain("停車場");
    expect(blurb).not.toContain("7-11");
    expect(blurb).not.toContain("超商");
  });

  test("過長時裁成卡片長度", () => {
    const blurb = composeParentBlurb(
      {
        tips: "園區幅員很大，可以先鎖定重新橋或熊猴森遊戲場再決定要不要往湖邊走；假日記得防曬。",
        facilities: ["遊戲場", "湖畔"],
        free: true,
        indoor: false,
      },
      40,
    );
    expect(blurb.length).toBeLessThanOrEqual(40);
  });
});

describe("clipParentVoice", () => {
  test("短句不裁", () => {
    expect(clipParentVoice("有洗手間。", 20)).toBe("有洗手間。");
  });
});

describe("formatVerifiedMonthLabel", () => {
  test("繁中年月", () => {
    expect(formatVerifiedMonthLabel("2026-08-13")).toBe(
      "資料於 2026 年 8 月核對",
    );
  });
});
