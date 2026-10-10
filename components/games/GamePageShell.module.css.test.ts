import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

describe("GamePageShell.module.css 抬頭", () => {
  const css = strip(readFileSync(join(import.meta.dirname, "GamePageShell.module.css"), "utf8"));
  const coloringCss = strip(
    readFileSync(join(import.meta.dirname, "../coloring/ColoringPageShell.module.css"), "utf8"),
  );
  const rules = (code: string) => [...code.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const playHeader = rules(css).find(([, selector]) => selector.trim() === ".playHeader")?.[2] ?? "";

  it("抬頭不得用 backdrop-filter（iOS 上 sticky 抬頭帶毛玻璃，「回遊樂園」會糊）", () => {
    expect(css).not.toMatch(/backdrop-filter/);
  });

  // iOS 26 狀態列下方的漸層模糊（同 SiteNavBar）：Safari 分頁要頂端那一點落在 sticky 抬頭裡，
  // 主畫面 App 要把內容放到 --edge-ramp 模糊帶下面
  it("抬頭底色完全不透明", () => {
    expect(playHeader).toMatch(/background:\s*var\(--bg\);/);
  });

  it("抬頭往上延伸蓋住 .main 上留白，sticky 也補同樣距離（內容位置不變）", () => {
    expect(playHeader).toMatch(/top:\s*calc\(-1 \* var\(--main-pad-top\)\)/);
    expect(playHeader).toMatch(/margin-top:\s*calc\(-1 \* var\(--main-pad-top\)\)/);
    expect(playHeader).toMatch(
      /padding-top:\s*calc\(var\(--main-pad-top\) \+ var\(--safe-top\) \+ var\(--edge-ramp\)\)/,
    );
  });

  it("所有改 .main 上留白的規則都走 --main-pad-top（含著色本），抬頭才延伸得剛好", () => {
    const mainRules = [...rules(css), ...rules(coloringCss)].filter(([, selector]) =>
      /\.main(\[[^\]]*\]|:has\([^)]*\))*\s*$/.test(selector.trim()),
    );
    const padded = mainRules.filter(([, , body]) => /padding(-top)?:/.test(body));
    expect(padded.length).toBeGreaterThanOrEqual(4);
    for (const [, selector, body] of padded) {
      expect(body, selector.trim()).toMatch(/--main-pad-top:/);
      expect(body, selector.trim()).toMatch(/padding-top:\s*var\(--main-pad-top\);/);
    }
  });

  it("抬頭 min-height 都含 --main-pad-top 與 --edge-ramp（min-height 含 padding）", () => {
    const minHeights = [...css.matchAll(/\.playHeader\s*\{[^}]*?min-height:\s*([^;]+);/g)].map((m) => m[1]);
    expect(minHeights.length).toBeGreaterThanOrEqual(3);
    for (const value of minHeights) {
      expect(value).toContain("var(--main-pad-top)");
      expect(value).toContain("var(--edge-ramp)");
    }
  });
});
