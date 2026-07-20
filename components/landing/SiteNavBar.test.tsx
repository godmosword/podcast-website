// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

afterEach(() => {
  cleanup();
});

async function renderNavBarHtml() {
  const { default: SiteNavBar } = await import("./SiteNavBar");
  const { ThemeProvider } = await import("@/components/ThemeProvider");
  return renderToStaticMarkup(
    <ThemeProvider>
      <SiteNavBar />
    </ThemeProvider>,
  );
}

async function renderNavBar() {
  const { default: SiteNavBar } = await import("./SiteNavBar");
  const { ThemeProvider } = await import("@/components/ThemeProvider");
  return render(
    <ThemeProvider>
      <SiteNavBar />
    </ThemeProvider>,
  );
}

describe("SiteNavBar", () => {
  test("renders brand, subscribe control, and menu button", async () => {
    const html = await renderNavBarHtml();
    expect(html).toContain("車車遊樂園");
    expect(html).toContain("訂閱收聽");
    expect(html).toContain("開啟選單");
  });

  test("無「更多」文案或按鈕", async () => {
    const html = await renderNavBarHtml();
    expect(html).not.toContain("更多");

    const view = await renderNavBar();
    expect(view.queryByRole("button", { name: /更多/ })).toBeNull();
  });

  test("桌面主列含宇宙地圖、育兒專欄與家長指南 trigger", async () => {
    const html = await renderNavBarHtml();
    for (const label of [
      "全部故事",
      "遊樂園",
      "宇宙地圖",
      "育兒專欄",
      "家長指南",
    ]) {
      expect(html).toContain(label);
    }
    // 成長主題自桌面主列降級（仍在行動抽屜與 /topic 頁）
    expect(html).not.toContain("主題分類");

    const view = await renderNavBar();
    const trigger = view.getByRole("button", { name: "家長指南" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("開啟家長指南後顯示指南首頁／關於／聯絡並更新 ARIA", async () => {
    const view = await renderNavBar();
    const trigger = view.getByRole("button", { name: "家長指南" });
    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const menu = view.getByRole("menu");
    expect(
      within(menu).getByRole("menuitem", { name: /指南首頁/ }).getAttribute("href"),
    ).toBe("/for-parents");
    expect(
      within(menu).getByRole("menuitem", { name: /關於我們/ }).getAttribute("href"),
    ).toBe("/about");
    expect(
      within(menu).getByRole("menuitem", { name: /聯絡我們/ }).getAttribute("href"),
    ).toMatch(/^mailto:/);
  });

  test("Esc、外點或點下拉連結可關閉家長指南選單", async () => {
    const view = await renderNavBar();
    const trigger = view.getByRole("button", { name: "家長指南" });

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    // jsdom：AnimatePresence exit 可能短暫保留 menu DOM，以 aria-expanded 為準
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerDown(document.body);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    const menu = view.getByRole("menu");
    fireEvent.click(within(menu).getByRole("menuitem", { name: /指南首頁/ }));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("行動版選單提供搜尋與單欄清單連結", async () => {
    const view = await renderNavBar();
    fireEvent.click(view.getByRole("button", { name: "開啟選單" }));

    for (const label of [
      "全部故事",
      "主題分類",
      "遊樂園",
      "宇宙地圖",
      "育兒專欄",
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

  test("開啟／關閉行動選單時 header 標記 data-menu-open", async () => {
    const view = await renderNavBar();
    const header = view.container.querySelector("header");
    expect(header).toBeTruthy();
    expect(header?.hasAttribute("data-menu-open")).toBe(false);

    fireEvent.click(view.getByRole("button", { name: "開啟選單" }));
    expect(header?.getAttribute("data-menu-open")).toBe("true");

    fireEvent.click(view.getByRole("button", { name: "關閉選單" }));
    expect(header?.hasAttribute("data-menu-open")).toBe(false);
  });

  test("首頁預設不標 data-nav-solid（無 #landing-foot 時）", async () => {
    const view = await renderNavBar();
    const header = view.container.querySelector("header");
    expect(header?.hasAttribute("data-nav-solid")).toBe(false);
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

  test("Threads 缺席時不顯示育兒專欄", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({
      usePathname: () => "/",
    }));
    vi.doMock("@/lib/social", () => ({
      visibleSocials: () => [],
    }));
    const { default: SiteNavBar } = await import("./SiteNavBar");
    const { ThemeProvider } = await import("@/components/ThemeProvider");
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <SiteNavBar />
      </ThemeProvider>,
    );
    expect(html).not.toContain("育兒專欄");
    expect(html).toContain("宇宙地圖");
    expect(html).toContain("家長指南");
  });
});
