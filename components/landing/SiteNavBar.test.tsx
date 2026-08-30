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
  test("頂欄常駐列：品牌＋選單觸發器＋常用組（首頁／訂閱／留言）", async () => {
    const html = await renderNavBarHtml();
    expect(html).toContain("車車遊樂園");
    expect(html).toContain("訂閱");
    expect(html).toContain("開啟選單");
    expect(html).toContain("首頁");
    expect(html).toContain("留言");

    const view = await renderNavBar();
    const brand = view.container.querySelector('header > div > a[href="/"]');
    expect(brand?.textContent).toContain("車車遊樂園");

    const menuBtn = view.getByRole("button", { name: "開啟選單" });
    expect(menuBtn.textContent).toContain("選單");

    const actions = view.getByRole("group", { name: "常用" });
    const homeAction = actions.querySelector("a.homeAction, a[class*='homeAction']");
    expect(homeAction?.textContent).toContain("首頁");
    expect(homeAction?.getAttribute("href")).toBe("/");
  });

  test("「留言」在頂欄常用組，不在抽屜", async () => {
    const view = await renderNavBar();

    const actions = view.getByRole("group", { name: "常用" });
    const feedback = actions.querySelector('a[href^="mailto:"]');
    expect(feedback).toBeTruthy();
    expect(feedback?.textContent).toContain("留言");
    expect(feedback?.getAttribute("target")).toBeNull();
    expect(feedback?.getAttribute("rel")).toBeNull();

    const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
    expect(panel.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(panel.textContent).not.toContain("留言");
  });

  test("抽屜關閉時連結仍在 DOM（爬蟲讀得到），且標記 inert", async () => {
    const html = await renderNavBarHtml();
    for (const href of [
      "/stories",
      "/characters",
      "/games",
      "/games/coloring-book",
      "/adventures",
      "/for-parents",
      "/for-parents/play-map",
    ]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain("mailto:");

    const view = await renderNavBar();
    const panel = view.container.querySelector('nav[aria-label="網站選單"]');
    expect(panel).toBeTruthy();
    expect(panel?.getAttribute("data-open")).toBe("false");
    expect(panel?.hasAttribute("inert")).toBe(true);

    fireEvent.click(view.getByRole("button", { name: "開啟選單" }));
    expect(panel?.getAttribute("data-open")).toBe("true");
    expect(panel?.hasAttribute("inert")).toBe(false);
  });

  test("無「更多」文案或按鈕", async () => {
    const html = await renderNavBarHtml();
    expect(html).not.toContain("更多");

    const view = await renderNavBar();
    expect(view.queryByRole("button", { name: /更多/ })).toBeNull();
  });

  test("桌面主列只有兒童三入口；家長項在抽屜（D0=C）", async () => {
    const html = await renderNavBarHtml();
    for (const label of [
      "全部故事",
      "角色圖鑑",
      "遊樂園",
      "宇宙地圖",
      "親子景點",
      "親子指南",
    ]) {
      expect(html).toContain(label);
    }
    expect(html).not.toContain("主題分類");
    expect(html).not.toContain("指南首頁");
    expect(html).not.toContain("關於我們");
    expect(html).not.toContain("聯絡我們");
    expect(html).not.toContain("育兒專欄");

    const view = await renderNavBar();
    const desktopNav = view.getByRole("navigation", { name: "主要分區" });

    for (const href of ["/stories", "/games", "/adventures"]) {
      expect(desktopNav.querySelector(`a[href="${href}"]`)).toBeTruthy();
    }
    for (const href of [
      "/for-parents",
      "/for-parents/play-map",
      "/characters",
      "/games/coloring-book",
    ]) {
      expect(desktopNav.querySelector(`a[href="${href}"]`)).toBeNull();
    }
    expect(desktopNav.querySelectorAll("a").length).toBe(3);
    expect(view.queryByRole("menu")).toBeNull();
  });

  test("主題切換移出頂欄，只在抽屜底部", async () => {
    const view = await renderNavBar();
    const themeGroup = view.getByRole("group", { name: "主題模式" });
    const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
    expect(panel.contains(themeGroup)).toBe(true);

    const topRow = view.container.querySelector("header > div")!;
    expect(topRow.contains(themeGroup)).toBe(true);
    const actions = view.getByRole("group", { name: "常用" });
    expect(actions.contains(themeGroup)).toBe(false);
  });

  test("抽屜家長組有小標「給爸媽」；探索組無標題", async () => {
    const view = await renderNavBar();
    fireEvent.click(view.getByRole("button", { name: "開啟選單" }));
    const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
    const labels = Array.from(panel.querySelectorAll("p")).map(
      (el) => el.textContent,
    );
    expect(labels).toEqual(["給爸媽"]);
  });

  test("抽屜恰好 7 個站內 href，不含首頁／mailto", async () => {
    const view = await renderNavBar();
    const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
    const panelHrefs = Array.from(panel.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    for (const href of [
      "/stories",
      "/characters",
      "/games",
      "/games/coloring-book",
      "/adventures",
      "/for-parents",
      "/for-parents/play-map",
    ]) {
      expect(panelHrefs).toContain(href);
    }
    expect(panelHrefs).not.toContain("/");
    expect(panelHrefs.some((h) => h?.startsWith("mailto:"))).toBe(false);
    expect(panelHrefs.length).toBe(7);
  });

  test("抽屜兩組各為 role=list，家長組以 aria-labelledby 綁小標", async () => {
    const view = await renderNavBar();
    const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
    const lists = panel.querySelectorAll('ul[role="list"]');
    expect(lists.length).toBe(2);

    const labelledBy = lists[1]?.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const label = panel.ownerDocument.getElementById(labelledBy!);
    expect(label?.textContent).toBe("給爸媽");
  });

  test("抽屜首列為全部故事", async () => {
    const view = await renderNavBar();
    const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
    const firstLink = panel.querySelector("a");
    expect(firstLink?.getAttribute("href")).toBe("/stories");
    expect(firstLink?.textContent).toContain("全部故事");
  });

  test("行動版選單提供單欄清單連結，不含搜尋列", async () => {
    const view = await renderNavBar();
    fireEvent.click(view.getByRole("button", { name: "開啟選單" }));

    for (const label of [
      "全部故事",
      "角色圖鑑",
      "遊樂園",
      "繪本著色",
      "宇宙地圖",
      "親子指南",
      "親子景點",
    ]) {
      expect(view.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(view.queryByText("主題分類")).toBeNull();
    expect(view.queryByText("育兒專欄")).toBeNull();
    expect(view.queryByText("關於我們")).toBeNull();
    expect(view.queryByText("聯絡我們")).toBeNull();
    expect(view.queryByText("指南首頁")).toBeNull();

    const mobileNav = view.getByRole("navigation", { name: "網站選單" });
    const parentLink = mobileNav.querySelector('a[href="/for-parents"]');
    expect(parentLink).toBeTruthy();
    expect(parentLink?.textContent).toContain("親子指南");

    const playMapLink = mobileNav.querySelector('a[href="/for-parents/play-map"]');
    expect(playMapLink).toBeTruthy();
    expect(playMapLink?.textContent).toContain("親子景點");

    expect(view.container.querySelector('form[action="/stories"]')).toBeNull();
    expect(view.container.querySelector('input[name="q"]')).toBeNull();
    expect(view.queryByRole("button", { name: "搜尋" })).toBeNull();
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

  test("Threads 缺席時導覽不受影響（親子指南仍在、無育兒專欄）", async () => {
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
    expect(html).toContain("親子指南");
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
    "/for-parents/play-map",
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

  test("親子指南 pathname 應 active", async () => {
    const { isInternalPathActive } = await import("./SiteNavBar");
    expect(isInternalPathActive("/for-parents", "/for-parents", hrefs)).toBe(
      true,
    );
    expect(
      isInternalPathActive("/for-parents/dashboard", "/for-parents", hrefs),
    ).toBe(true);
  });

  test("在 /for-parents/play-map 時親子指南不得 active（完整 siblings）", async () => {
    const { isInternalPathActive } = await import("./SiteNavBar");
    expect(
      isInternalPathActive("/for-parents/play-map", "/for-parents", hrefs),
    ).toBe(false);
    expect(
      isInternalPathActive("/for-parents/play-map", "/for-parents/play-map", hrefs),
    ).toBe(true);
  });

  test("在 /for-parents/play-map 時桌面主列 siblings 讓親子景點獨佔 active", async () => {
    const { isInternalPathActive } = await import("./SiteNavBar");
    const primaryHrefs = [
      "/stories",
      "/characters",
      "/games",
      "/adventures",
      "/for-parents/play-map",
      "/for-parents",
    ];
    expect(
      isInternalPathActive("/for-parents/play-map", "/for-parents", primaryHrefs),
    ).toBe(false);
    expect(
      isInternalPathActive(
        "/for-parents/play-map",
        "/for-parents/play-map",
        primaryHrefs,
      ),
    ).toBe(true);
  });

  test("首頁與 /about 不應標親子指南 active", async () => {
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

  test("/for-parents 與子路徑在抽屜標 aria-current（家長項已不在桌面主列）", async () => {
    for (const pathname of ["/for-parents", "/for-parents/dashboard"]) {
      const view = await renderNavBarAt(pathname);
      const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
      const link = panel.querySelector('a[href="/for-parents"]');
      expect(link?.getAttribute("aria-current")).toBe("page");
      cleanup();
    }
  });

  test("/for-parents/play-map 僅親子景點 active", async () => {
    const view = await renderNavBarAt("/for-parents/play-map");
    fireEvent.click(view.getByRole("button", { name: "開啟選單" }));

    const mobileNav = view.getByRole("navigation", { name: "網站選單" });
    const playMapLink = mobileNav.querySelector('a[href="/for-parents/play-map"]');
    const parentMobile = mobileNav.querySelector('a[href="/for-parents"]');
    expect(playMapLink?.getAttribute("aria-current")).toBe("page");
    expect(parentMobile?.hasAttribute("aria-current")).toBe(false);
  });

  test("/adventures 僅宇宙地圖 active（桌面主列＋抽屜同步）", async () => {
    const view = await renderNavBarAt("/adventures");
    const desktopNav = view.getByRole("navigation", { name: "主要分區" });
    const adventuresLink = desktopNav.querySelector('a[href="/adventures"]');
    expect(adventuresLink?.getAttribute("aria-current")).toBe("page");

    const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
    expect(
      panel.querySelector('a[href="/adventures"]')?.getAttribute("aria-current"),
    ).toBe("page");
    expect(
      panel.querySelector('a[href="/for-parents"]')?.hasAttribute("aria-current"),
    ).toBe(false);
  });

  test("首頁 aria-current 在常用組 .homeAction，抽屜無首頁列", async () => {
    const home = await renderNavBarAt("/");
    const actions = home.getByRole("group", { name: "常用" });
    const homeAction = actions.querySelector("a[class*='homeAction']");
    expect(homeAction?.getAttribute("aria-current")).toBe("page");

    const homePanel = home.container.querySelector('nav[aria-label="網站選單"]')!;
    expect(homePanel.querySelector('a[href="/"]')).toBeNull();
    cleanup();

    for (const pathname of ["/stories", "/about", "/for-parents"]) {
      const view = await renderNavBarAt(pathname);
      const actionsGroup = view.getByRole("group", { name: "常用" });
      const link = actionsGroup.querySelector("a[class*='homeAction']");
      expect(link?.hasAttribute("aria-current")).toBe(false);

      const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
      expect(panel.querySelector('a[href="/"]')).toBeNull();
      expect(view.container.querySelectorAll('[aria-current="page"]').length)
        .toBeLessThanOrEqual(2);
      cleanup();
    }
  });

  test("首頁與 /about 不標親子指南 active", async () => {
    for (const pathname of ["/", "/about"]) {
      const view = await renderNavBarAt(pathname);
      const panel = view.container.querySelector('nav[aria-label="網站選單"]')!;
      const link = panel.querySelector('a[href="/for-parents"]');
      expect(link?.hasAttribute("aria-current")).toBe(false);
      cleanup();
    }
  });
});
