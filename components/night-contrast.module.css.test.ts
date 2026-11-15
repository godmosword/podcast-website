import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(join(import.meta.dirname, f), "utf8");

describe("夜間主鈕與 EP 標籤對比", () => {
  it("夜間深墨主鈕（PlayButton、LatestHero 立即看故事）加淺色 inset 描邊，不改尺寸", () => {
    expect(read("PlayButton.module.css")).toMatch(
      /\[data-theme="night"\]\) \.button\s*\{[^}]*box-shadow:\s*inset 0 0 0 1\.5px color-mix\(in srgb, var\(--on-dark\) 40%, transparent\)/,
    );
    expect(read("LatestHero.module.css")).toMatch(
      /\[data-theme="night"\]\) \.cta\s*\{[^}]*box-shadow:\s*inset 0 0 0 1\.5px/,
    );
  });

  it("夜間 EP 標籤底不透明、往亮處混 20%（全域 .marker::before 是 opacity 0.55，不蓋掉會透出深色卡底，約 2:1）", () => {
    const css = read("StoryCard.module.css");
    const start = css.indexOf(':global([data-theme="night"]) .ep::before {');
    const block = css.slice(start, css.indexOf("}", start));
    expect(start).toBeGreaterThan(-1);
    expect(block).toMatch(/opacity:\s*1;/);
    expect(block).toMatch(/color-mix\(in srgb, var\(--c-lilac\) 80%, var\(--on-dark\)\)/);
  });
});

describe("LatestHero 768–979 欄寬", () => {
  const css = read("LatestHero.module.css");

  it("768 起封面與文字對半（右欄太窄時標題會被切在詞中間），980 起回到 1.2:0.8", () => {
    const tablet = css.slice(css.indexOf("@media (min-width: 768px)"));
    expect(tablet).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) minmax\(200px, 1fr\)/);
    const desktop = css.slice(css.indexOf("@media (min-width: 980px)"));
    expect(desktop).toMatch(/grid-template-columns:\s*minmax\(0, 1\.2fr\) minmax\(200px, 0\.8fr\)/);
  });
});
