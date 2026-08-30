// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

vi.mock("next/navigation", () => ({
  usePathname: () => "/stories",
}));

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
});

async function renderDockAt(pathname: string) {
  vi.resetModules();
  vi.doMock("next/navigation", () => ({
    usePathname: () => pathname,
  }));
  const { default: KidsPlayDock } = await import("./KidsPlayDock");
  return render(<KidsPlayDock />);
}

describe("KidsPlayDock", () => {
  test("內頁渲染 nav[aria-label=\"去玩\"] 與三連結", async () => {
    const view = await renderDockAt("/stories");

    const nav = view.getByRole("navigation", { name: "去玩" });
    expect(nav).toBeTruthy();
    expect(nav.hasAttribute("data-kids-dock")).toBe(true);

    for (const href of ["/stories", "/games", "/adventures"]) {
      expect(nav.querySelector(`a[href="${href}"]`)).toBeTruthy();
    }

    expect(view.getByText("全部故事")).toBeTruthy();
    expect(view.getByText("遊樂園")).toBeTruthy();
    expect(view.getByText("宇宙地圖")).toBeTruthy();

    const emojis = nav.querySelectorAll('[aria-hidden="true"]');
    expect(emojis.length).toBe(3);
    expect(emojis[0]?.textContent).toBe("📖");
    expect(emojis[1]?.textContent).toBe("🎡");
    expect(emojis[2]?.textContent).toBe("🗺️");
  });

  test("/about 也渲染 dock", async () => {
    const view = await renderDockAt("/about");
    expect(view.getAllByRole("navigation", { name: "去玩" })).toHaveLength(1);
  });

  test("首頁 pathname / 不渲染 dock", async () => {
    const view = await renderDockAt("/");
    expect(view.queryAllByRole("navigation", { name: "去玩" })).toHaveLength(0);
  });

  test("沉浸式路由不渲染 dock", async () => {
    for (const pathname of [
      "/story/ep-27/play",
      "/games/candy-match",
      "/games/block-drop",
    ]) {
      const view = await renderDockAt(pathname);
      expect(view.queryAllByRole("navigation", { name: "去玩" })).toHaveLength(
        0,
      );
      cleanup();
    }
  });

  test("/games/coloring-book 顯示 dock，遊樂園不得 aria-current", async () => {
    const view = await renderDockAt("/games/coloring-book");
    const nav = view.getByRole("navigation", { name: "去玩" });
    const gamesLink = nav.querySelector('a[href="/games"]');
    expect(gamesLink).toBeTruthy();
    expect(gamesLink?.hasAttribute("aria-current")).toBe(false);
  });

  test("/adventures 世界層 lift + flush 且標宇宙地圖 aria-current", async () => {
    const view = await renderDockAt("/adventures");
    const nav = view.getByRole("navigation", { name: "去玩" });
    const adventuresLink = nav.querySelector('a[href="/adventures"]');
    expect(adventuresLink?.getAttribute("aria-current")).toBe("page");
    expect(nav.querySelector('a[href="/stories"]')?.hasAttribute("aria-current")).toBe(
      false,
    );
    expect(nav.querySelector('a[href="/games"]')?.hasAttribute("aria-current")).toBe(
      false,
    );
    expect(nav.hasAttribute("data-lift")).toBe(true);
    expect(nav.getAttribute("data-lift")).toBe("picker");
    expect(nav.hasAttribute("data-kids-dock-flush")).toBe(true);
  });

  test("/adventures/car-park 島層 flush、無 lift，宇宙地圖仍 aria-current", async () => {
    const view = await renderDockAt("/adventures/car-park");
    const nav = view.getByRole("navigation", { name: "去玩" });
    expect(nav.querySelector('a[href="/adventures"]')?.getAttribute("aria-current")).toBe(
      "page",
    );
    expect(nav.hasAttribute("data-lift")).toBe(false);
    expect(nav.hasAttribute("data-kids-dock-flush")).toBe(true);
  });

  test("/stories 不抬 dock、不 flush 底距", async () => {
    const view = await renderDockAt("/stories");
    const nav = view.getByRole("navigation", { name: "去玩" });
    expect(nav.hasAttribute("data-lift")).toBe(false);
    expect(nav.hasAttribute("data-kids-dock-flush")).toBe(false);
  });

  test("/for-parents/play-map hub 滿版地圖 flush、無 lift", async () => {
    const view = await renderDockAt("/for-parents/play-map");
    const nav = view.getByRole("navigation", { name: "去玩" });
    expect(nav.hasAttribute("data-kids-dock-flush")).toBe(true);
    expect(nav.hasAttribute("data-lift")).toBe(false);
  });

  test("/for-parents/play-map 子路徑不 flush、不 lift", async () => {
    for (const pathname of [
      "/for-parents/play-map/ty-fenghe",
      "/for-parents/play-map/collections",
    ]) {
      const view = await renderDockAt(pathname);
      const nav = view.getByRole("navigation", { name: "去玩" });
      expect(nav.hasAttribute("data-kids-dock-flush")).toBe(false);
      expect(nav.hasAttribute("data-lift")).toBe(false);
      cleanup();
    }
  });

  test("/stories 標全部故事 aria-current", async () => {
    const view = await renderDockAt("/stories");
    const nav = view.getByRole("navigation", { name: "去玩" });
    expect(
      nav.querySelector('a[href="/stories"]')?.getAttribute("aria-current"),
    ).toBe("page");
    expect(nav.querySelector('a[href="/games"]')?.hasAttribute("aria-current")).toBe(
      false,
    );
    expect(
      nav.querySelector('a[href="/adventures"]')?.hasAttribute("aria-current"),
    ).toBe(false);
  });

  test("/games 標遊樂園 aria-current", async () => {
    const view = await renderDockAt("/games");
    const nav = view.getByRole("navigation", { name: "去玩" });
    expect(nav.querySelector('a[href="/games"]')?.getAttribute("aria-current")).toBe(
      "page",
    );
    expect(
      nav.querySelector('a[href="/stories"]')?.hasAttribute("aria-current"),
    ).toBe(false);
    expect(
      nav.querySelector('a[href="/adventures"]')?.hasAttribute("aria-current"),
    ).toBe(false);
  });
});

describe("isDockLinkActive", () => {
  test("/games 僅精確匹配 hub", async () => {
    const { isDockLinkActive } = await import("./KidsPlayDock");
    expect(isDockLinkActive("/games", "/games")).toBe(true);
    expect(isDockLinkActive("/games/coloring-book", "/games")).toBe(false);
    expect(isDockLinkActive("/games/candy-match", "/games")).toBe(false);
  });

  test("/stories 與 /adventures 含子路徑", async () => {
    const { isDockLinkActive } = await import("./KidsPlayDock");
    expect(isDockLinkActive("/stories", "/stories")).toBe(true);
    expect(isDockLinkActive("/stories/ep-1", "/stories")).toBe(true);
    expect(isDockLinkActive("/adventures", "/adventures")).toBe(true);
    expect(isDockLinkActive("/adventures/car-park", "/adventures")).toBe(true);
  });
});
