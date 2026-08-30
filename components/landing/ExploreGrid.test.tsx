// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import ExploreGrid from "./ExploreGrid";
import { EXPLORE_MAP_CARD, EXPLORE_TILES } from "@/data/explore-tiles";

vi.stubGlobal("React", React);

afterEach(() => {
  cleanup();
});

describe("ExploreGrid", () => {
  test("標題與所有磁貼標籤都是 HTML 文字（非燒進圖片）", () => {
    const html = renderToStaticMarkup(<ExploreGrid />);
    expect(html).toContain("都去哪裡玩？");
    for (const tile of EXPLORE_TILES) {
      expect(html).toContain(tile.label);
    }
    expect(html).toContain(EXPLORE_MAP_CARD.label);
  });

  test("區塊標題不叫「探索」（該詞是導覽抽屜的分組語彙）", () => {
    const view = render(<ExploreGrid />);
    const heading = view.getByRole("heading", { level: 2 });
    expect(heading.textContent).toBe("都去哪裡玩？");
    expect(heading.textContent).not.toContain("探索");
  });

  test("磁貼與地圖大卡都是連結，不是 div onClick", () => {
    const view = render(<ExploreGrid />);
    for (const tile of EXPLORE_TILES) {
      const link = view.container.querySelector(`a[href="${tile.href}"]`);
      expect(link).toBeTruthy();
      expect(link?.tagName).toBe("A");
    }
    const mapLink = view.container.querySelector(
      `a[href="${EXPLORE_MAP_CARD.href}"]`,
    );
    expect(mapLink).toBeTruthy();
  });

  test("圖徽為裝飾（aria-hidden），可及名稱由文字標籤承擔", () => {
    const view = render(<ExploreGrid />);
    // 逐一斷言「emoji 那些節點」本身，而非只數 aria-hidden 總量
    const links = view.container.querySelectorAll("ul[data-audience] a");
    expect(links.length).toBe(EXPLORE_TILES.length);
    for (const link of links) {
      const spans = link.querySelectorAll("span");
      expect(spans.length).toBe(2);
      expect(spans[0]?.hasAttribute("aria-hidden")).toBe(true);
      expect(spans[1]?.hasAttribute("aria-hidden")).toBe(false);
      expect(spans[1]?.textContent?.length).toBeGreaterThan(0);
    }

    const img = view.container.querySelector("img");
    expect(img?.getAttribute("alt")).toBe("");
  });

  test("兩組清單有 role=list 與可及名稱（Safari 會移除 list-style:none 的清單語意）", () => {
    const view = render(<ExploreGrid />);
    const lists = view.container.querySelectorAll('ul[role="list"]');
    expect(lists.length).toBe(2);
    expect(lists[0]?.getAttribute("aria-label")).toBe("小朋友的入口");
    expect(lists[1]?.getAttribute("aria-label")).toBe("給家長");
  });

  test("地圖大卡圖片 lazy 且未使用 blur placeholder（首頁 SSR HTML 預算）", () => {
    const html = renderToStaticMarkup(<ExploreGrid />);
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain("data:image/");
  });

  test("兒童入口在前、家長入口在後，且分屬兩列", () => {
    const view = render(<ExploreGrid />);
    const rows = view.container.querySelectorAll("ul[data-audience]");
    expect(rows.length).toBe(2);
    expect(rows[0]?.getAttribute("data-audience")).toBe("child");
    expect(rows[1]?.getAttribute("data-audience")).toBe("parent");
  });
});

describe("EXPLORE_TILES 契約", () => {
  test("標籤使用 DESIGN.md 鎖定名稱，不得改寫", () => {
    const labels = EXPLORE_TILES.map((t) => t.label);
    expect(labels).toEqual([
      "全部故事",
      "遊樂園",
      "繪本著色",
      "角色圖鑑",
      "親子指南",
      "親子景點",
    ]);
  });

  test("宇宙地圖不重複出現在磁貼（由地圖大卡承接）", () => {
    // 型別層已鎖住 literal union；此處保留執行期斷言防資料被改寬
    const hrefs: readonly string[] = EXPLORE_TILES.map((t) => t.href);
    expect(hrefs).not.toContain("/adventures");
    expect(EXPLORE_MAP_CARD.href).toBe("/adventures");
  });

  test("磁貼＋大卡合計覆蓋 7 個內容頁入口", () => {
    const hrefs = new Set([
      ...EXPLORE_TILES.map((t) => t.href),
      EXPLORE_MAP_CARD.href,
    ]);
    expect(hrefs).toEqual(
      new Set([
        "/stories",
        "/characters",
        "/games",
        "/games/coloring-book",
        "/adventures",
        "/for-parents",
        "/for-parents/play-map",
      ]),
    );
  });
});
