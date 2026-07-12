import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// 膠囊列桌面版常駐 ThemeModeSwitch，SSR 測試以 ThemeProvider 包裹
async function renderNavBar() {
  const { default: SiteNavBar } = await import("./SiteNavBar");
  const { ThemeProvider } = await import("@/components/ThemeProvider");
  return renderToStaticMarkup(
    <ThemeProvider>
      <SiteNavBar />
    </ThemeProvider>,
  );
}

describe("SiteNavBar", () => {
  test("renders brand, subscribe control, and menu button", async () => {
    const html = await renderNavBar();
    expect(html).toContain("車車遊樂園");
    expect(html).toContain("訂閱收聽");
    expect(html).toContain("開啟選單");
  });

  test("桌面膠囊內嵌四個主要導覽項與更多下拉", async () => {
    const html = await renderNavBar();
    for (const label of ["全部故事", "主題分類", "遊樂園", "家長指南", "更多"]) {
      expect(html).toContain(label);
    }
  });

  test("play route hides site nav bar", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({
      usePathname: () => "/story/ep-14/play",
    }));
    const { default: SiteNavBar } = await import("./SiteNavBar");
    const html = renderToStaticMarkup(<SiteNavBar />);
    expect(html).toBe("");
  });
});
