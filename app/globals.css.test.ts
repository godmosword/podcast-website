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

describe("globals.css radius tokens", () => {
  const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

  it("定義 --radius-pill／--radius-circle／--radius-xs 且值對齊角色階梯", () => {
    expect(css).toMatch(/--radius-pill:\s*999px\s*;/);
    expect(css).toMatch(/--radius-circle:\s*50%\s*;/);
    expect(css).toMatch(/--radius-xs:\s*8px\s*;/);
  });
});

describe("globals.css intro overlay stacking", () => {
  const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

  it("閘門打開時覆蓋層讓出頂欄高度，不把 .site-root 抬過導覽", () => {
    expect(css).toMatch(
      /html\[data-intro-gate="on"\]\s+\[data-intro-overlay\]\s*\{[^}]*padding-top:\s*var\(--nav-h\)/,
    );
    expect(css).not.toMatch(/html\[data-intro-gate="on"\]\s+\.site-root\s*\{[^}]*z-index:\s*60/);
  });
});
