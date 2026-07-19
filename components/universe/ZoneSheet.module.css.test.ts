import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** MAP-UX-P1a／P1b：ZoneSheet 觸控與 modal overlay 契約。 */
describe("ZoneSheet.module.css touch and modal", () => {
  const css = readFileSync(
    join(import.meta.dirname, "ZoneSheet.module.css"),
    "utf8",
  );

  it("關閉鈕與許願 toggle 觸控區 ≥44px", () => {
    expect(css).toMatch(/\.close\s*\{[\s\S]*?width:\s*44px[\s\S]*?height:\s*44px/);
    expect(css).toMatch(/\.wishToggle\s*\{[\s\S]*?min-height:\s*44px/);
  });

  it("sheet 開啟時 overlay 攔截指標（擋地圖 pan）", () => {
    expect(css).toMatch(/\.overlay\s*\{[\s\S]*?pointer-events:\s*auto/);
  });

  it("sheet 高度採動態上限", () => {
    expect(css).toMatch(/max-height:\s*min\(64vh,\s*30rem\)/);
  });
});
