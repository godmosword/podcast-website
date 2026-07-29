import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 召喚抽屜：觸控與非模態 overlay 契約。 */
describe("ZoneSheet.module.css touch and summon drawer", () => {
  const css = readFileSync(
    join(import.meta.dirname, "ZoneSheet.module.css"),
    "utf8",
  );

  it("關閉鈕、召喚把手與 disclosure toggle 觸控區達標", () => {
    expect(css).toMatch(/\.close\s*\{[\s\S]*?width:\s*48px[\s\S]*?height:\s*48px/);
    expect(css).toMatch(/\.summonHandle\s*\{[\s\S]*?min-height:\s*56px/);
    expect(css).toMatch(/\.wishToggle\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.exploreToggle\s*\{[\s\S]*?min-height:\s*48px/);
  });

  it("overlay 收合無 scrim；展開才掛 overlayScrim；passthrough 不擋 pan", () => {
    expect(css).toMatch(/\.overlay\s*\{[\s\S]*?background:\s*none/);
    expect(css).toMatch(/\.overlayScrim\s*\{[\s\S]*?linear-gradient/);
    expect(css).toMatch(/\.overlayPassthrough\s*\{[\s\S]*?pointer-events:\s*none/);
  });

  it("展開面板高度採較低動態上限（≤40vh）；橫向有高度下限", () => {
    expect(css).toMatch(/max-height:\s*min\(40vh,\s*28rem\)/);
    expect(css).toMatch(
      /@media\s*\(orientation:\s*landscape\)[\s\S]*?min-height:\s*11rem/,
    );
  });

  it("召喚把手走 --map-chip* 色票", () => {
    expect(css).toMatch(/\.summonHandle\s*\{[\s\S]*?var\(--map-chip\)/);
    expect(css).toMatch(/var\(--map-chip-ink\)/);
  });

  it("主 CTA linkBtnPrimary 觸控區 ≥48px", () => {
    expect(css).toMatch(/\.linkBtnPrimary\s*\{[\s\S]*?min-height:\s*52px/);
    const match = css.match(/\.linkBtnPrimary\s*\{[\s\S]*?min-height:\s*(\d+)px/);
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(48);
  });
});
