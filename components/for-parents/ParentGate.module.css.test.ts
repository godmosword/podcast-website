import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** UX-P0-1：閘門輸入框與送出鈕觸控高度 ≥44px（對齊 UX-P0-2）。 */
describe("ParentGate.module.css touch targets", () => {
  const css = readFileSync(
    join(import.meta.dirname, "ParentGate.module.css"),
    "utf8",
  );

  it("輸入框與送出鈕 min-height 44px", () => {
    expect(css).toMatch(/\.input,\s*\n\.submit\s*\{[\s\S]*?min-height:\s*44px/);
  });
});
