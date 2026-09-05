import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("stories/page.module.css 桌機欄寬", () => {
  const css = readFileSync(join(import.meta.dirname, "page.module.css"), "utf8");

  it("基礎欄寬仍是 640；≥768 才放到 1100", () => {
    const base = css.slice(0, css.indexOf("@media (min-width: 768px)"));
    expect(base).toMatch(/\.main\s*\{[\s\S]*?max-width:\s*640px/);
    expect(base).not.toContain("1100px");

    const desktop = css.slice(css.indexOf("@media (min-width: 768px)"));
    expect(desktop).toMatch(/\.main\s*\{[\s\S]*?max-width:\s*1100px/);
  });
});
