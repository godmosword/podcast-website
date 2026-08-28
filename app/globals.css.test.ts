import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 字級階梯第二階段：四個角色 token 必須存在且值固定。 */
describe("globals.css font-size tokens", () => {
  const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

  it("定義 --fs-label／--fs-control／--fs-body／--fs-h4 且值對齊角色階梯", () => {
    expect(css).toMatch(/--fs-label:\s*0\.85rem\s*;/);
    expect(css).toMatch(/--fs-control:\s*0\.94rem\s*;/);
    expect(css).toMatch(/--fs-body:\s*1(?:\.0+)?rem\s*;/);
    expect(css).toMatch(/--fs-h4:\s*1\.05rem\s*;/);
  });
});
