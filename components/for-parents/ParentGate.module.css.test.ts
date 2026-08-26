import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("ParentGate.module.css touch targets", () => {
  const css = readFileSync(
    join(import.meta.dirname, "ParentGate.module.css"),
    "utf8",
  );

  it("送出鈕與返回連結 min-height 44px", () => {
    expect(css).toMatch(/\.submit\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.back\s*\{[\s\S]*?min-height:\s*44px/);
  });
});
