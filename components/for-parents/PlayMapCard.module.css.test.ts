import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("PlayMapCard.module.css 契約", () => {
  const css = readFileSync(
    join(import.meta.dirname, "PlayMapCard.module.css"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");

  it("correlated 與 selected 是兩個可分的層級，滑過時也不被 hover 陰影蓋掉", () => {
    expect(css).toMatch(/\.cardCorrelated,\s*\.cardCorrelated:hover\s*\{[^}]*box-shadow:/s);
    expect(css).toMatch(
      /\.cardSelected,\s*\.cardSelected:hover\s*\{[^}]*inset 0 0 0 2px var\(--accent-ink\)/s,
    );
  });

  it("不再依類型著色（類型色框沒有圖例，已移除）", () => {
    expect(css).not.toMatch(/data-type/);
    expect(css).not.toMatch(/--card-accent/);
  });

  it("導航維持 44px 熱區、soft 樣式，不在任何寬度隱藏", () => {
    expect(css).toMatch(/\.cardNav\s*\{[^}]*min-height:\s*44px/s);
    expect(css).toMatch(/\.cardNav\s*\{[^}]*background:\s*var\(--warm-chip-bg\)/s);
    expect(css).not.toMatch(/\.cardNav[^{]*\{[^}]*display:\s*none/s);
  });

  it("事實是文字，不做成 pill", () => {
    expect(css).not.toMatch(/\.cardFact\s*\{[^}]*border-radius/s);
  });

  it("夜間加深卡片邊界（--elev-1 在深底看不見）", () => {
    expect(css).toMatch(/\[data-theme="night"\]\)\s*\.card\s*\{[^}]*border-color/s);
  });

  it("不使用 backdrop-filter、CSS blur() 與地圖 overlay 色票", () => {
    expect(css).not.toMatch(/backdrop-filter|\bblur\(|--map-chip/);
  });
});
