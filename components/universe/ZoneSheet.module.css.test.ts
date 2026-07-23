import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** MAP-UX-P1a／P1b：ZoneSheet 觸控與 modal overlay 契約。 */
describe("ZoneSheet.module.css touch and modal", () => {
  const css = readFileSync(
    join(import.meta.dirname, "ZoneSheet.module.css"),
    "utf8",
  );

  it("關閉鈕與許願 toggle 觸控區達標（關閉≥48、toggle≥44）", () => {
    expect(css).toMatch(/\.close\s*\{[\s\S]*?width:\s*48px[\s\S]*?height:\s*48px/);
    expect(css).toMatch(/\.wishToggle\s*\{[\s\S]*?min-height:\s*44px/);
  });

  it("sheet 開啟時 overlay 攔截指標（擋地圖 pan）", () => {
    expect(css).toMatch(/\.overlay\s*\{[\s\S]*?pointer-events:\s*auto/);
  });

  it("sheet 高度採動態上限", () => {
    expect(css).toMatch(/max-height:\s*min\(64vh,\s*30rem\)/);
  });

  it("主 CTA linkBtnPrimary 觸控區 ≥48px", () => {
    expect(css).toMatch(/\.linkBtnPrimary\s*\{[\s\S]*?min-height:\s*52px/);
    const match = css.match(/\.linkBtnPrimary\s*\{[\s\S]*?min-height:\s*(\d+)px/);
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(48);
  });
});
