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
});
