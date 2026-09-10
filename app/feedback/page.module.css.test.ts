import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("feedback page.module.css", () => {
  const css = readFileSync(join(import.meta.dirname, "page.module.css"), "utf8");

  it("邀請是段落行高，不再一行一格", () => {
    expect(css).toMatch(/\.invite\s*\{[\s\S]*?line-height:\s*1\.7/);
    expect(css).not.toContain(".inviteLines");
    expect(css).not.toContain(".inviteLine");
    expect(css).not.toContain(".inviteChild");
  });

  it("頁底暖色帶，表單不另做信紙卡或相框", () => {
    expect(css).toMatch(/\.main\s*\{[\s\S]*?--page-warm-from/);
    expect(css).not.toContain(".portraitMat");
    expect(css).not.toContain(".bubble");
    expect(css).not.toContain(".mascot");
    expect(css).not.toContain("formSection::before");
    expect(css).not.toMatch(/\.formSection\s*\{[\s\S]*?background:\s*var\(--warm-surface\)/);
  });
});
