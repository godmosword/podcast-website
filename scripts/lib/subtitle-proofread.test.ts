import { describe, expect, it } from "vitest";
import {
  applySafeAutoFixes,
  lintSubtitles,
  type SubtitleSegment,
} from "./subtitle-proofread";

describe("applySafeAutoFixes", () => {
  it("修正 Bonbon／馬米品牌名", () => {
    const segments: SubtitleSegment[] = [
      { t: 0, text: "嗨 我是 寶寶" },
      { t: 5, text: "我是媽咪" },
    ];
    const { segments: fixed, fixCount } = applySafeAutoFixes(segments);
    expect(fixCount).toBeGreaterThanOrEqual(2);
    expect(fixed[0].text).toContain("Bonbon");
    expect(fixed[1].text).toContain("馬米");
  });
});

describe("lintSubtitles", () => {
  it("抓出同音誤字與錯誤角色名", () => {
    const segments: SubtitleSegment[] = [
      { t: 100, text: "小蔥喜歡吃雞" },
      { t: 110, text: "全部都按了下來" },
    ];
    const report = lintSubtitles("ep-test", segments);
    const codes = report.issues.map((i) => i.code);
    expect(codes).toContain("wrong-char-name");
    expect(codes).toContain("homophone-stimulus");
    expect(codes).toContain("homophone-an");
  });

  it("乾淨字幕零 issue", () => {
    const segments: SubtitleSegment[] = [
      { t: 0, text: "嗨 我是 Bonbon" },
      { t: 5, text: "我是馬米" },
    ];
    const report = lintSubtitles("ep-test", segments);
    expect(report.issues).toEqual([]);
  });
});

describe("autoProofreadFix 流程", () => {
  it("fix 品牌名後仍保留待人工 lint", () => {
    const segments: SubtitleSegment[] = [
      { t: 0, text: "嗨 我是 寶寶" },
      { t: 5, text: "小蔥喜歡吃雞" },
    ];
    const { segments: fixed, fixCount } = applySafeAutoFixes(segments);
    expect(fixCount).toBeGreaterThanOrEqual(1);
    expect(fixed[0].text).toContain("Bonbon");
    const lint = lintSubtitles("ep-test", fixed);
    expect(lint.issues.length).toBeGreaterThan(0);
  });
});
