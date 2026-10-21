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

  it("卡框不依類型著色；類型色只在圓章上，七類都有色", () => {
    expect(css).not.toMatch(/\.card[^{]*\[data-type/);
    expect(css).not.toMatch(/--card-accent/);
    for (const key of ["indoor-park", "theme-park", "museum", "zoo", "farm", "other"]) {
      expect(css).toContain(`.typeBadge[data-type="${key}"]`);
    }
    expect(css).toMatch(/\.typeBadge\s*\{[^}]*color:\s*var\(--pm-type-ink\)/s);
  });

  it("理由行走 --pm-reason token（日夜對比由 globals 對比測試把關）", () => {
    expect(css).toMatch(/\.cardReason\s*\{[^}]*color:\s*var\(--pm-reason\)/s);
  });

  it("導航維持 44px 熱區、soft 樣式（不用品牌橘當底），不在任何寬度隱藏", () => {
    expect(css).toMatch(/\.cardNav\s*\{[^}]*min-height:\s*44px/s);
    expect(css).toMatch(/\.cardNav\s*\{[^}]*background:\s*var\(--cta-soft-bg\)/s);
    expect(css).not.toMatch(/\.cardNav\s*\{[^}]*--landing-brand\b/s);
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
