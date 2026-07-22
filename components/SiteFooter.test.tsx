// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("SiteFooter", () => {
  test("不含 ThemeModeSwitch；頁尾 meta 含關於／節目數據／條款／隱私連結與家長安心條", async () => {
    const { default: SiteFooter } = await import("./SiteFooter");
    const html = renderToStaticMarkup(<SiteFooter layout="home" />);

    expect(html).not.toContain('aria-label="主題模式"');
    expect(html).toContain('href="/about"');
    expect(html).toContain("關於我們");
    expect(html).toContain('href="/studio"');
    expect(html).toContain("節目數據");
    expect(html).toContain('href="/legal"');
    expect(html).toContain("使用條款與免責聲明");
    expect(html).toContain('href="/legal#privacy"');
    expect(html).toContain("隱私說明");
    expect(html).toContain("無廣告");
    expect(html).toContain('aria-label="家長安心資訊"');
    expect(html).toContain("去遊樂園玩");
  });

  test("campaign 傳入時平台外連帶 utm_campaign", async () => {
    const { default: SiteFooter } = await import("./SiteFooter");
    const html = renderToStaticMarkup(
      <SiteFooter compact campaign="ep-20" />,
    );

    expect(html).toContain("utm_campaign=ep-20");
    expect(html).toContain("utm_medium=footer");
  });
});
