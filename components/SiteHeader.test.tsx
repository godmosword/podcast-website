import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

vi.mock("@/components/HeaderThemeToggle", () => ({
  default: () => <button type="button" aria-label="切換主題" />,
}));

describe("SiteHeader", () => {
  test("uses the simplified audience message on the home hero", async () => {
    const { default: SiteHeader } = await import("./SiteHeader");

    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain("給 3-7 歲孩子，適合看圖聽故事");
    expect(html).toContain("marker marker-mint");
    expect(html).not.toContain("audiencePill");
    expect(html).not.toContain("用車車故事陪伴孩子成長");
    expect(html).not.toContain("給 3–7 歲孩子與家長");
    expect(html).toContain('class="sr-only"');
  });
});
