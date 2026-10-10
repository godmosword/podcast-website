import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("GamePageShell.module.css 抬頭", () => {
  const css = readFileSync(join(import.meta.dirname, "GamePageShell.module.css"), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );

  it("毛玻璃只放在 ::before：.playHeader 本身不得有 backdrop-filter（Safari 會連「回遊樂園」一起糊）", () => {
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const withBackdrop = rules.filter(([, , body]) => /backdrop-filter/.test(body!));
    expect(withBackdrop.map(([, selector]) => selector!.trim())).toEqual([".playHeader::before"]);
  });
});
