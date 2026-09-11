import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");

describe("IntroOverlay 與頂欄分層", () => {
  const css = stripComments(
    readFileSync(join(import.meta.dirname, "IntroOverlay.module.css"), "utf8"),
  );

  it("覆蓋層不把自己抬過 sticky 頂欄", () => {
    expect(css).toMatch(/\.overlay\s*\{[^}]*z-index:\s*1\s*;/);
    expect(css).not.toMatch(/\.overlay\s*\{[^}]*z-index:\s*60\s*;/);
  });
});
