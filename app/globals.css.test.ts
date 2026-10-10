import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 字級階梯第二階段：四個角色 token 必須存在且值固定。 */
describe("globals.css font-size tokens", () => {
  const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

  it("定義 --fs-label／--fs-control／--fs-body／--fs-h4 且值對齊角色階梯", () => {
    expect(css).toMatch(/--fs-label:\s*0\.85rem\s*;/);
    expect(css).toMatch(/--fs-control:\s*0\.94rem\s*;/);
    expect(css).toMatch(/--fs-body:\s*1(?:\.0+)?rem\s*;/);
    expect(css).toMatch(/--fs-h4:\s*1\.05rem\s*;/);
  });
});

describe("globals.css radius tokens", () => {
  const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

  it("定義 --radius-pill／--radius-circle／--radius-xs 且值對齊角色階梯", () => {
    expect(css).toMatch(/--radius-pill:\s*999px\s*;/);
    expect(css).toMatch(/--radius-circle:\s*50%\s*;/);
    expect(css).toMatch(/--radius-xs:\s*8px\s*;/);
  });
});

describe("globals.css intro overlay stacking", () => {
  const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

  it("閘門打開時覆蓋層讓出頂欄高度，不把 .site-root 抬過導覽", () => {
    expect(css).toMatch(
      /html\[data-intro-gate="on"\]\s+\[data-intro-overlay\]\s*\{[^}]*padding-top:\s*var\(--nav-h\)/,
    );
    expect(css).not.toMatch(/html\[data-intro-gate="on"\]\s+\.site-root\s*\{[^}]*z-index:\s*60/);
  });
});

/**
 * iOS 主畫面 App 的頂端模糊帶（iOS 26 捲動邊緣效果，頁面關不掉）：頂欄、遊戲抬頭、故事播放器頂排
 * 都要在 safe-top 之外再空 --edge-ramp，字才落在模糊帶下面。只在 iOS standalone 生效，其餘為 0。
 */
describe("globals.css --edge-ramp", () => {
  const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const read = (path: string) => readFileSync(join(import.meta.dirname, "..", path), "utf8");

  it("預設 0，只在 iOS（-webkit-touch-callout）的 standalone 改成 32px", () => {
    expect(css).toMatch(/:root\s*\{[^}]*--edge-ramp:\s*0px;/);
    expect(css).toMatch(
      /@supports \(-webkit-touch-callout: none\)\s*\{\s*@media \(display-mode: standalone\)\s*\{\s*:root\s*\{\s*--edge-ramp:\s*32px;/,
    );
  });

  it("--nav-h 兩個斷點都含 --edge-ramp（landing pane、地圖高度都靠它）", () => {
    expect(css).toContain("--nav-h: calc(64px + var(--safe-top) + var(--edge-ramp));");
    expect(css).toContain("--nav-h: calc(66px + var(--safe-top) + var(--edge-ramp));");
  });

  it("頂欄、遊戲抬頭、故事播放器頂排都用 --edge-ramp", () => {
    expect(read("components/landing/SiteNavBar.module.css")).toContain("var(--edge-ramp)");
    expect(read("components/games/GamePageShell.module.css")).toContain("var(--edge-ramp)");
    expect(read("components/StoryPlayer.module.css")).toMatch(
      /\.topBar\s*\{[^}]*padding:\s*calc\(10px \+ var\(--safe-top\) \+ var\(--edge-ramp\)\)/,
    );
  });
});
