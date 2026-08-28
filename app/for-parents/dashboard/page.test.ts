import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGE = join(process.cwd(), "app/for-parents/dashboard/page.tsx");

describe("dashboard parent gate shell", () => {
  it("以 ParentGate 包住 ParentDashboard，metadata 維持可索引", () => {
    const source = readFileSync(PAGE, "utf8");
    expect(source).toMatch(
      /<ParentGate>\s*<ParentDashboard\s*\/>\s*<\/ParentGate>/,
    );
    expect(source).toContain('title: "家庭儀表板"');
    expect(source).toContain('canonical: "/for-parents/dashboard"');
  });
});
