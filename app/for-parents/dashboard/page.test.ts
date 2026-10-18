import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGE = join(process.cwd(), "app/for-parents/dashboard/page.tsx");

describe("dashboard page shell", () => {
  it("直接顯示儀表板，不用家長算術題擋住；metadata 維持可索引", () => {
    const source = readFileSync(PAGE, "utf8");
    expect(source).not.toContain("ParentGate");
    expect(source).toMatch(/<ParentDashboard\s*\/>/);
    expect(source).toContain('title: "家庭儀表板"');
    expect(source).toContain('canonical: "/for-parents/dashboard"');
  });

  it("工具頁不掛 SiteHeader 行銷圖，也不露出內部代號", () => {
    const source = readFileSync(PAGE, "utf8");
    expect(source).not.toContain("SiteHeader");
    expect(source).not.toContain("STEM-P3");
    expect(source).toContain("給爸媽");
  });
});
