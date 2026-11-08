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

describe("GamePageShell.module.css 夜間鎖奶油", () => {
  const css = strip(readFileSync(join(import.meta.dirname, "GamePageShell.module.css"), "utf8"));
  const nightMain = css.match(/:global\(\[data-theme="night"\] body:has\(main\[data-game-id="orange-express"\]\)\),?\s*\{([^}]*)\}/)?.[1] ?? "";

  it("同一組 token 也套在 body（portal 到 body 的對話框才拿得到日間的紙）", () => {
    const block = css.slice(0, css.indexOf("{", css.indexOf('.main[data-game-id="candy-match"],')));
    expect(block).toContain('body:has(main[data-game-id="coloring-book"])');
    expect(nightMain).toMatch(/--card:\s*var\(--game-day-paper\)/);
  });

  // :root 用夜間值算好的衍生 token，只改來源不會跟著變；遊戲頁要照式子重宣告一次（2026-11-08）
  it.each([
    ["--surface-elevated", /--surface-elevated:\s*var\(--card\)/],
    ["--hairline", /--hairline:\s*var\(--game-day-hairline\)/],
    ["--line", /--line:\s*var\(--hairline\)/],
    ["--accent-ink", /--accent-ink:\s*var\(--game-day-accent-ink\)/],
    ["--cta-quiet-fg（「回遊樂園」連結）", /--cta-quiet-fg:\s*var\(--accent-ink\)/],
    ["--cta-soft-bg", /--cta-soft-bg:\s*var\(--card\)/],
    ["--focus-ring", /--focus-ring:\s*var\(--ink\)/],
    ["--c-yellow（小橘選中卡、星星）", /--c-yellow:\s*var\(--game-day-c-yellow\)/],
    ["--c-lilac", /--c-lilac:\s*var\(--game-day-c-lilac\)/],
    ["--elev-1", /--elev-1:\s*var\(--game-day-elev-1\)/],
    ["--shadow-md", /--shadow-md:\s*var\(--game-day-shadow-md\)/],
  ])("夜間遊戲頁重算 %s", (_name, pattern) => {
    expect(nightMain).toMatch(pattern);
  });

  it("--game-day-* 跟 :root 日間值一樣（改了日間色要一起改）", () => {
    const globals = strip(readFileSync(join(import.meta.dirname, "../../app/globals.css"), "utf8"));
    const root = globals.slice(globals.indexOf(":root {"), globals.indexOf('[data-theme="night"] {'));
    const value = (name: string) =>
      root.match(new RegExp(`\\s${name}:\\s*([^;]+);`))?.[1]?.replace(/\s+/g, " ").trim();
    for (const name of ["c-pink", "c-yellow", "c-mint", "c-sky", "c-teal", "c-lilac", "elev-1", "elev-2", "elev-3", "shadow-sm", "shadow-md", "mix-base", "landing-brand", "accent-ink", "hairline"]) {
      expect(value(`--game-day-${name}`), name).toBe(value(`--${name}`));
    }
  });

  it("夜間灰紫外框不套在鎖奶油的四款", () => {
    expect(css).toMatch(/\.main:not\(\[data-game-id="candy-match"\], \[data-game-id="dino-sushi"\], \[data-game-id="coloring-book"\], \[data-game-id="orange-express"\]\) \.playArea/);
  });
});
