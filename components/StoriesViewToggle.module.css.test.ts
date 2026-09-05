import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("StoriesViewToggle.module.css", () => {
  const css = readFileSync(
    join(import.meta.dirname, "StoriesViewToggle.module.css"),
    "utf8",
  );

  it("預設隱藏，只在 ≥768 顯示，觸控區 ≥44px", () => {
    const baseWrap = css.slice(
      css.indexOf(".wrap {"),
      css.indexOf("@media (min-width: 768px)"),
    );
    expect(baseWrap).toMatch(/display:\s*none/);

    const desktop = css.slice(css.indexOf("@media (min-width: 768px)"));
    expect(desktop).toMatch(/\.wrap\s*\{[\s\S]*?display:\s*inline-flex/);
    expect(css).toMatch(/\.segment\s*\{[\s\S]*?min-width:\s*44px/);
    expect(css).toMatch(/\.segment\s*\{[\s\S]*?min-height:\s*44px/);
  });
});
