import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("feedback page.module.css", () => {
  const css = readFileSync(join(import.meta.dirname, "page.module.css"), "utf8");

  it("邀請改成段落行高，不再一行一格", () => {
    expect(css).toMatch(/\.inviteChild\s*\{[\s\S]*?line-height:\s*1\.7/);
    expect(css).not.toContain(".inviteLines");
    expect(css).not.toContain(".inviteLine");
  });

  it("頁底暖色帶、馬米相框與對話泡泡", () => {
    expect(css).toMatch(/\.main\s*\{[\s\S]*?--page-warm-from/);
    expect(css).toContain(".portraitMat");
    expect(css).toContain(".bubble");
    expect(css).not.toContain(".mascot");
    expect(css).toMatch(/\.formSection\s*\{[\s\S]*?background:\s*var\(--warm-surface\)/);
    expect(css).toMatch(/\.formSection::before\s*\{[\s\S]*?width:\s*2px/);
  });
});
