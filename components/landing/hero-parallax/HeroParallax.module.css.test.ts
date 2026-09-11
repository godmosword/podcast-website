import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");

describe("HeroParallax.module.css 直式手機 band", () => {
  const css = stripComments(
    readFileSync(join(import.meta.dirname, "HeroParallax.module.css"), "utf8"),
  );

  const narrow = (() => {
    const start = css.indexOf("@media (max-width: 768px)");
    expect(start, "缺少 ≤768 區塊").toBeGreaterThan(-1);
    const end = css.indexOf("@media", start + 1);
    return css.slice(start, end === -1 ? undefined : end);
  })();

  const tiny = (() => {
    const start = css.indexOf("@media (max-width: 430px)");
    expect(start, "缺少 ≤430 區塊").toBeGreaterThan(-1);
    const end = css.indexOf("@media", start + 1);
    return css.slice(start, end === -1 ? undefined : end);
  })();

  it("直向 band 改為相對定位，才吃得下 Hero 的場景列", () => {
    expect(narrow).toMatch(/\.band\s*\{[^}]*position:\s*relative/);
  });

  it("直向不要把素材縮成中間一條被卡斷的薄片", () => {
    const scale = /--s:\s*([\d.]+)/.exec(narrow);
    expect(scale, "≤768 必須宣告 --s").not.toBeNull();
    expect(Number(scale?.[1])).toBeGreaterThanOrEqual(0.7);
  });

  it("更窄的手機也不准退回 0.5 的薄片縮放", () => {
    const scale = /--s:\s*([\d.]+)/.exec(tiny);
    expect(scale, "≤430 必須宣告 --s").not.toBeNull();
    expect(Number(scale?.[1])).toBeGreaterThanOrEqual(0.65);
  });

  it("直向地平線接到近景，L5 不沉出裁切", () => {
    expect(narrow).toMatch(/--horizon:\s*62%/);
    expect(narrow).toMatch(/\.l5\s*\{[^}]*bottom:\s*0/);
    expect(narrow).toMatch(/container-type:\s*size/);
    expect(narrow).toMatch(/100cqh\s*\/\s*680px/);
  });
});
