import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 地圖控制鈕的色票契約：必須走 --map-chip*（日夜不反轉）。
 * 用 --card／--cta-warm-fg 會在夜間變成深靛底＋深棕字，壓在深靛夜海上
 * 輪廓與字都消失（正式站回饋 2026-07-27）。
 */
describe("MapControls.module.css 夜間可辨契約", () => {
  const css = readFileSync(
    join(import.meta.dirname, "MapControls.module.css"),
    "utf8",
  );
  const btnBlock = css.slice(css.indexOf(".btn {"), css.indexOf(".btn svg"));

  it(".btn 底／字／邊皆用 --map-chip* token", () => {
    expect(btnBlock).toMatch(
      /background:\s*linear-gradient\(var\(--map-chip\),\s*var\(--map-chip-2\)\)/,
    );
    expect(btnBlock).toMatch(/color:\s*var\(--map-chip-ink\)/);
    expect(btnBlock).toMatch(/border:[^;]*var\(--map-chip-line\)/);
  });

  it(".btn 不吃夜間會反轉的表面／前景 token", () => {
    expect(btnBlock).not.toMatch(/var\(--card/);
    expect(btnBlock).not.toMatch(/var\(--cta-warm-fg\)/);
    expect(btnBlock).not.toMatch(/var\(--ink\)/);
  });

  it("命中區維持 ≥48px（幼兒觸控）", () => {
    expect(btnBlock).toMatch(/width:\s*56px/);
    expect(btnBlock).toMatch(/height:\s*56px/);
  });
});
