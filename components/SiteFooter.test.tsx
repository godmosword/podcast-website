// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("SiteFooter", () => {
  test("不含 ThemeModeSwitch；頁尾 meta 含關於／節目數據／條款連結", async () => {
    const { default: SiteFooter } = await import("./SiteFooter");
    const html = renderToStaticMarkup(<SiteFooter layout="home" />);

    expect(html).not.toContain('aria-label="主題模式"');
    expect(html).toContain('href="/about"');
    expect(html).toContain("關於我們");
    expect(html).toContain('href="/studio"');
    expect(html).toContain("節目數據");
    expect(html).toContain('href="/legal"');
    expect(html).toContain("使用條款與免責聲明");
    expect(html).toContain("去遊樂園玩");
  });
});
