// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render } from "@testing-library/react";
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

  test("行動版選單提供搜尋與單欄清單連結", async () => {
    const { default: SiteNavBar } = await import("./SiteNavBar");
    const { ThemeProvider } = await import("@/components/ThemeProvider");
    const view = render(
      <ThemeProvider>
        <SiteNavBar />
      </ThemeProvider>,
    );
    fireEvent.click(view.getByRole("button", { name: "開啟選單" }));

    for (const label of [
      "全部故事",
      "主題分類",
      "遊樂園",
      "宇宙地圖",
      "家長指南",
      "關於我們",
      "聯絡我們",
    ]) {
      expect(view.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(view.container.querySelector('form[action="/stories"]')).toBeTruthy();
    expect(view.container.querySelector('input[name="q"]')).toBeTruthy();
    // 搜尋標籤改為視覺隱藏但保留可及性
    expect(view.getByLabelText("搜尋故事或主題")).toBeTruthy();
    // 主題切換縮成圖示段控，仍具 aria-label
    expect(view.getAllByRole("group", { name: "主題模式" }).length).toBeGreaterThan(0);
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
