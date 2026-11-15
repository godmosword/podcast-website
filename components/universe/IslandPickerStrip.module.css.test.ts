import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("IslandPickerStrip.module.css", () => {
  const css = readFileSync(join(import.meta.dirname, "IslandPickerStrip.module.css"), "utf8");

  it("島名用 --fs-meta，不再寫 11px；寬度用 em 跟字走（最長五個字不截），卡片同寬 84px", () => {
    const start = css.indexOf(".name {");
    const block = css.slice(start, css.indexOf("}", start));
    expect(block).toMatch(/font-size:\s*var\(--fs-meta\)/);
    expect(block).toMatch(/max-width:\s*5\.5em/);
    expect(css).not.toMatch(/font-size:\s*11px/);
    expect(css).toMatch(/\.chip\s*\{[^}]*min-width:\s*84px/);
  });
});
