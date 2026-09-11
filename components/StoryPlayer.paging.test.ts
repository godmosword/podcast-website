import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE = readFileSync(
  join(process.cwd(), "components/StoryPlayer.tsx"),
  "utf8",
);

describe("StoryPlayer 插圖跟讀", () => {
  it("timeupdate 不因關閉字幕而停止換頁", () => {
    expect(SOURCE).not.toMatch(/if \(!subtitlesOn\) return;\s*\/\/ 翻頁定位/);
    expect(SOURCE).toContain("插圖一律跟音檔時間走");
    expect(SOURCE).toContain('el.addEventListener("seeked", handleTimeUpdate)');
  });

  it("關閉字幕時的左右翻頁改跳插圖", () => {
    expect(SOURCE).toMatch(/function prev\(\) \{\s*skipIllustration\(-1\);/);
    expect(SOURCE).toMatch(/function next\(\) \{\s*skipIllustration\(1\);/);
  });
});
