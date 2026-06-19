import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("SiteHeader", () => {
  test("renders a clean home hero without the audience badge", async () => {
    const { default: SiteHeader } = await import("./SiteHeader");

    const html = renderToStaticMarkup(<SiteHeader />);

    // 年齡徽章已移除，讓首屏更乾淨
    expect(html).not.toContain("給 3-7 歲孩子，適合看圖聽故事");
    expect(html).not.toContain("marker marker-mint");
    expect(html).not.toContain("audiencePill");
    expect(html).not.toContain("用車車故事陪伴孩子成長");
    // 主題切換已移到頁尾，不應再出現在 header
    expect(html).not.toContain("主題模式");
    // 仍保留無障礙標題
    expect(html).toContain('class="sr-only"');
  });
});
