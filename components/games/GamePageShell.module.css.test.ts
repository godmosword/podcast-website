import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("GamePageShell.module.css 抬頭", () => {
  const css = readFileSync(join(import.meta.dirname, "GamePageShell.module.css"), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );

  it("抬頭不得用 backdrop-filter（iOS Safari 上 sticky 抬頭帶毛玻璃，「回遊樂園」會糊）", () => {
    expect(css).not.toMatch(/backdrop-filter/);
  });
});
