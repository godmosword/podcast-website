// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { CONTACT_EMAIL } from "@/lib/contact";

vi.stubGlobal("React", React);

describe("SiteFooter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("不含 ThemeModeSwitch；頁尾 meta 含關於／聯絡／節目數據／條款，隱私列含安心訊號", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_FORM_URL", "");
    const { default: SiteFooter } = await import("./SiteFooter");
    const html = renderToStaticMarkup(<SiteFooter layout="home" />);

    expect(html).not.toContain('aria-label="主題模式"');
    expect(html).not.toContain('aria-label="家長安心資訊"');
    expect(html).toContain('href="/about"');
    expect(html).toContain("關於我們");
    expect(html).toContain("聯絡我們");
    expect(html).toContain(`href="mailto:${CONTACT_EMAIL}"`);
    expect(html).toContain('href="/studio"');
    expect(html).toContain("節目數據");
    expect(html).toContain('href="/legal"');
    expect(html).toContain("使用條款與免責聲明");
    expect(html).toContain('href="/legal#privacy"');
    expect(html).toContain("隱私說明");
    expect(html).toContain("無廣告");
    expect(html).toContain("不收孩子帳號");
    expect(html).toContain("去遊樂園玩");
  });

  test("NEXT_PUBLIC_CONTACT_FORM_URL 設定時聯絡我們為外連表單", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_CONTACT_FORM_URL",
      "https://forms.example.com/contact",
    );
    vi.resetModules();
    const { default: SiteFooter } = await import("./SiteFooter");
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain("聯絡我們");
    expect(html).toContain('href="https://forms.example.com/contact"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('aria-label="聯絡我們（另開視窗）"');
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
