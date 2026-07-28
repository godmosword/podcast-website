// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render } from "@testing-library/react";
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

  test("桌面主列含宇宙地圖、角色圖鑑、育兒專欄與家長指南直連", async () => {
    const html = await renderNavBarHtml();
    for (const label of [
      "全部故事",
      "角色圖鑑",
      "遊樂園",
      "宇宙地圖",
      "育兒專欄",
      "家長指南",
    ]) {
      expect(html).toContain(label);
    }
    // 成長主題不佔導覽（桌面膠囊與行動抽屜皆無；頁面仍可直達 /topic）
    expect(html).not.toContain("主題分類");
    // 導覽內不再輸出 about／contact
    expect(html).not.toContain("指南首頁");
    expect(html).not.toContain("關於我們");
    expect(html).not.toContain("聯絡我們");

    const view = await renderNavBar();
    const desktopNav = view.getByRole("navigation", { name: "主要分區" });
    const parentLink = desktopNav.querySelector('a[href="/for-parents"]');
    expect(parentLink).toBeTruthy();
    expect(parentLink?.textContent).toContain("家長指南");
    expect(view.queryByRole("button", { name: "家長指南" })).toBeNull();
    expect(view.queryByRole("menu")).toBeNull();
  });

  test("行動版選單提供搜尋與單欄清單連結", async () => {
    const view = await renderNavBar();
    fireEvent.click(view.getByRole("button", { name: "開啟選單" }));

    for (const label of [
      "全部故事",
      "角色圖鑑",
      "遊樂園",
      "繪本著色",
      "宇宙地圖",
      "育兒專欄",
      "家長指南",
    ]) {
      expect(view.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(view.queryByText("主題分類")).toBeNull();
    expect(view.queryByText("關於我們")).toBeNull();
    expect(view.queryByText("聯絡我們")).toBeNull();
    expect(view.queryByText("指南首頁")).toBeNull();

    const mobileNav = view.getByRole("navigation", { name: "網站選單" });
    const parentLink = mobileNav.querySelector('a[href="/for-parents"]');
    expect(parentLink).toBeTruthy();
    expect(parentLink?.textContent).toContain("家長指南");

    expect(view.container.querySelector('form[action="/stories"]')).toBeTruthy();
    expect(view.container.querySelector('input[name="q"]')).toBeTruthy();
    // 搜尋標籤改為視覺隱藏但保留可及性
    expect(view.getByLabelText("搜尋故事或主題")).toBeTruthy();
    // 主題切換縮成圖示段控，仍具 aria-label
    expect(view.getAllByRole("group", { name: "主題模式" }).length).toBeGreaterThan(0);
  });

  test("Esc 可關閉行動選單", async () => {
    const view = await renderNavBar();
    const menuBtn = view.getByRole("button", { name: "開啟選單" });
    fireEvent.click(menuBtn);
    expect(view.getByRole("button", { name: "關閉選單" })).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(view.getByRole("button", { name: "開啟選單" })).toBeTruthy();
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

describe("isInternalPathActive 最長匹配", () => {
  const hrefs = [
    "/stories",
    "/characters",
    "/topic",
    "/games",
    "/games/coloring-book",
    "/adventures",
    "/for-parents",
  ];

  test("在 /games 時只有遊樂園 active", async () => {
    const { isInternalPathActive } = await import("./SiteNavBar");
    expect(isInternalPathActive("/games", "/games", hrefs)).toBe(true);
    expect(
      isInternalPathActive("/games", "/games/coloring-book", hrefs),
    ).toBe(false);
  });

  test("在 /games/coloring-book 時遊樂園不得同時 active", async () => {
    const { isInternalPathActive } = await import("./SiteNavBar");
    // 未修正前 /games 也會回 true，導致兩個 aria-current="page"
    expect(isInternalPathActive("/games/coloring-book", "/games", hrefs)).toBe(
      false,
    );
    expect(
      isInternalPathActive("/games/coloring-book", "/games/coloring-book", hrefs),
    ).toBe(true);
  });

  test("其他遊戲子頁仍歸遊樂園", async () => {
    const { isInternalPathActive } = await import("./SiteNavBar");
    expect(
      isInternalPathActive("/games/candy-match", "/games", hrefs),
    ).toBe(true);
  });

  test("外連／mailto 不視為站內 active", async () => {
    const { isInternalPathActive } = await import("./SiteNavBar");
    expect(isInternalPathActive("/games", "mailto:a@b.c", hrefs)).toBe(false);
  });

  test("家長指南 pathname 應 active", async () => {
    const { isInternalPathActive } = await import("./SiteNavBar");
    expect(isInternalPathActive("/for-parents", "/for-parents", hrefs)).toBe(
      true,
    );
    expect(
      isInternalPathActive("/for-parents/dashboard", "/for-parents", hrefs),
    ).toBe(true);
  });

  test("首頁與 /about 不應標家長指南 active", async () => {
    const { isInternalPathActive } = await import("./SiteNavBar");
    expect(isInternalPathActive("/", "/for-parents", hrefs)).toBe(false);
    expect(isInternalPathActive("/about", "/for-parents", hrefs)).toBe(false);
  });
});

describe("SiteNavBar active 狀態", () => {
  async function renderNavBarAt(pathname: string) {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({
      usePathname: () => pathname,
    }));
    const { default: SiteNavBar } = await import("./SiteNavBar");
    const { ThemeProvider } = await import("@/components/ThemeProvider");
    return render(
      <ThemeProvider>
        <SiteNavBar />
      </ThemeProvider>,
    );
  }

  test("/for-parents 與子路徑標 aria-current", async () => {
    for (const pathname of ["/for-parents", "/for-parents/dashboard"]) {
      const view = await renderNavBarAt(pathname);
      const desktopNav = view.getByRole("navigation", { name: "主要分區" });
      const link = desktopNav.querySelector('a[href="/for-parents"]');
      expect(link?.getAttribute("aria-current")).toBe("page");
      cleanup();
    }
  });

  test("首頁與 /about 不標家長指南 active", async () => {
    for (const pathname of ["/", "/about"]) {
      const view = await renderNavBarAt(pathname);
      const desktopNav = view.getByRole("navigation", { name: "主要分區" });
      const link = desktopNav.querySelector('a[href="/for-parents"]');
      expect(link?.hasAttribute("aria-current")).toBe(false);
      cleanup();
    }
  });
});
