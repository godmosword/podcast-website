import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");
const css = stripComments(
  readFileSync(join(import.meta.dirname, "parent-dashboard.module.css"), "utf8"),
);

function rule(selector: string, source = css): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

const desktop =
  css.match(/@media \(min-width: 980px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const stickyDesktop =
  css.match(
    /@media \(min-width: 980px\) and \(min-height: 640px\)\s*\{([\s\S]*?)\n\}/,
  )?.[1] ?? "";

describe("家庭儀表板電腦版：主欄＋固定側欄", () => {
  it("和導覽列同寬 960", () => {
    expect(rule(".parentDashboard")).toMatch(/width:\s*min\(960px,\s*100%\)/);
  });

  it("右欄只放「接著聽」並縱貫每一列，主欄依序是本週、進度、遊戲、設定", () => {
    expect(desktop).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s+330px/);
    const areas = desktop.match(/grid-template-areas:([^;]*);/)?.[1] ?? "";
    expect(areas.replace(/\s+/g, " ").trim()).toBe(
      '"week next" "progress next" "games next" "settings next"',
    );
  });

  it("接著聽固定在導覽列下方，但只在視窗夠高時（矮視窗固定住會讓下半截永遠看不到）", () => {
    expect(rule(".areaNext", desktop)).not.toMatch(/position:\s*sticky/);
    expect(rule(".areaNext", desktop)).toMatch(/align-self:\s*start/);
    const next = rule(".areaNext", stickyDesktop);
    expect(next).toMatch(/position:\s*sticky/);
    expect(next).toMatch(/top:\s*calc\(var\(--nav-h\)\s*\+\s*var\(--space-4\)\)/);
  });
});

describe("家庭儀表板對比", () => {
  it("卡片標題用 --ink，不用偏淡的 --warm-heading", () => {
    expect(rule(".cardTitle")).toMatch(/color:\s*var\(--ink\)/);
  });

  it("次要文字與卡片邊框用儀表板自己較深的 token", () => {
    const root = rule(".parentDashboard");
    expect(root).toMatch(/--dash-soft:/);
    expect(root).toMatch(/--dash-line:/);
    expect(rule(".card")).toMatch(/border:\s*1px solid var\(--dash-line\)/);
    expect(rule(".rowMeta")).toMatch(/color:\s*var\(--dash-soft\)/);
    expect(rule(".note")).toMatch(/color:\s*var\(--dash-soft\)/);
  });

  it("標籤底維持 16%：再深字的對比會掉到 AA 以下", () => {
    expect(rule(".parentDashboard")).toMatch(
      /--dash-chip:\s*color-mix\(in srgb, var\(--accent\) 16%/,
    );
  });

  it("夜間另有一組較收斂的次要字與「今天」底色", () => {
    const night = rule(':global([data-theme="night"]) .parentDashboard');
    expect(night).toMatch(/--dash-soft:/);
    expect(night).toMatch(/--dash-today:/);
    expect(rule(".weekToday")).toMatch(/background:\s*var\(--dash-today\)/);
  });
});
