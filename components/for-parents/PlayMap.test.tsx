// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listPlaygrounds, PLAYGROUND_TYPES } from "@/data/playgrounds";
import { filterPlaygrounds } from "@/lib/playgrounds-query";
import { coverageHeadline, listCityCoverage } from "@/lib/playground-coverage";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import { VISIBLE_STEP } from "./PlayMapContract";
import PlayMap from "./PlayMap";

vi.stubGlobal("React", React);

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
  usePathname: () => "/for-parents/play-map",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockPlayMapLeaflet() {
      return <div data-testid="map-container" />;
    },
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion")
        ? false
        : query.includes("min-width: 640px"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  replaceMock.mockClear();
});

function cityChipName(city: string): RegExp {
  const count = listCityCoverage().find((row) => row.city === city)?.count ?? 0;
  return new RegExp(`^${city}，${count} 個地點$`);
}

function typeChipName(type: string, count: number): RegExp {
  return new RegExp(`^${type}，${count} 個地點$`);
}

function summaryText(
  city: string,
  count: number,
  extras: string[] = [],
): string {
  const parts = [city, ...extras];
  return `${parts.join(" · ")} → ${count} 個地點`;
}

function openFilters() {
  const toggle = screen.getByRole("button", { name: "篩選" });
  if (toggle.getAttribute("aria-expanded") !== "true") {
    fireEvent.click(toggle);
  }
}

/** 反覆點「載入更多」直到全部命中卡片都可見。 */
function showAllCards(): void {
  for (let i = 0; i < 20; i += 1) {
    const more = screen.queryByRole("button", { name: "載入更多" });
    if (!more) return;
    fireEvent.click(more);
  }
}

describe("PlayMap", () => {
  it("預設選取全部縣市與卡片瀏覽，並顯示意圖入口", () => {
    render(<PlayMap />);
    expect(
      screen.getByRole("heading", { level: 1, name: "親子遊樂地圖" }),
    ).toBeTruthy();

    // 「室內」同時存在於意圖列與條件 facet（共用 state），故限定在意圖群組內查。
    const intentGroup = screen.getByRole("group", { name: "意圖快捷" });
    expect(
      within(intentGroup).getByRole("button", { name: "離我最近" }),
    ).toBeTruthy();
    expect(
      within(intentGroup).getByRole("button", { name: "免費放電" }),
    ).toBeTruthy();
    expect(within(intentGroup).getByRole("button", { name: "室內" })).toBeTruthy();

    openFilters();
    const cityGroup = screen.getByRole("group", { name: "依縣市篩選" });
    const allChip = within(cityGroup).getByRole("button", {
      name: /全部，\d+ 個地點/,
    });
    expect(allChip.getAttribute("aria-pressed")).toBe("true");

    expect(
      screen.getByRole("tab", { name: "卡片" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("切換免費放電會改變結果數", () => {
    render(<PlayMap />);
    const baseline = filterPlaygrounds().length;
    const freeCount = filterPlaygrounds({ freeOnly: true }).length;

    expect(screen.getByText(summaryText("全部", baseline))).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "免費放電" }));

    expect(screen.getByText(summaryText("全部", freeCount, ["免費"]))).toBeTruthy();
  });

  /**
   * 「主題樂園」本身是 type，已由意圖列下放到類型 facet
   * （原本同詞在意圖與類型兩層重複出現）。
   */
  it("主題樂園改由類型 facet 縮小結果", () => {
    render(<PlayMap />);
    openFilters();
    const themeCount = filterPlaygrounds({ type: "主題樂園" }).length;

    fireEvent.click(
      screen.getByRole("button", {
        name: typeChipName("主題樂園", themeCount),
      }),
    );

    expect(
      screen.getByText(summaryText("全部", themeCount, ["主題樂園"])),
    ).toBeTruthy();
  });

  it("意圖列只留三顆跨類型的一級動線", () => {
    render(<PlayMap />);
    const intents = within(
      screen.getByRole("group", { name: "意圖快捷" }),
    ).getAllByRole("button");

    expect(intents.map((btn) => btn.textContent)).toEqual([
      "離我最近",
      "免費放電",
      "室內",
    ]);
  });

  it("條件 facet 與意圖列共用同一組狀態，不會雙軌不同步", () => {
    render(<PlayMap />);
    openFilters();
    const conditions = screen.getByRole("group", { name: "依條件篩選" });
    const indoorFacet = within(conditions).getByRole("button", {
      name: "室內",
    });
    const indoorIntent = within(
      screen.getByRole("group", { name: "意圖快捷" }),
    ).getByRole("button", { name: "室內" });

    fireEvent.click(indoorIntent);
    expect(indoorFacet.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(indoorFacet);
    expect(indoorIntent.getAttribute("aria-pressed")).toBe("false");
  });

  it("類型篩選會縮小結果", () => {
    render(<PlayMap />);
    openFilters();
    const parkCount = filterPlaygrounds({ type: "公園" }).length;

    fireEvent.click(
      screen.getByRole("button", { name: typeChipName("公園", parkCount) }),
    );

    expect(
      screen.getByText(summaryText("全部", parkCount, ["公園"])),
    ).toBeTruthy();
  });

  it("清除條件保留縣市並還原類型／進階篩選", () => {
    render(<PlayMap />);
    openFilters();
    fireEvent.click(
      within(screen.getByRole("group", { name: "依縣市篩選" })).getByRole(
        "button",
        { name: cityChipName("台北市") },
      ),
    );

    const baseline = filterPlaygrounds({ city: "台北市" }).length;
    const parkCount = filterPlaygrounds({ city: "台北市", type: "公園" }).length;

    fireEvent.click(
      screen.getByRole("button", { name: typeChipName("公園", parkCount) }),
    );
    fireEvent.click(screen.getByRole("button", { name: "免費放電" }));

    expect(screen.getByRole("button", { name: "清除條件" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "清除條件" }));

    expect(screen.getByText(summaryText("台北市", baseline))).toBeTruthy();
    expect(screen.queryByRole("button", { name: "清除條件" })).toBeNull();
    expect(
      within(screen.getByRole("group", { name: "依縣市篩選" })).getByRole(
        "button",
        { name: cityChipName("台北市") },
      ).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("可切換至地圖瀏覽", () => {
    const { container } = render(<PlayMap />);
    fireEvent.click(screen.getByRole("tab", { name: "地圖" }));

    expect(
      screen.getByRole("tab", { name: "地圖" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(false);
    expect(
      container.querySelector("#play-map-panel-cards")?.hasAttribute("hidden"),
    ).toBe(true);
    expect(screen.getByTestId("map-container")).toBeTruthy();
  });

  it("卡片首屏不掛地圖，切過地圖後再回卡片仍保持掛載", () => {
    const { container } = render(<PlayMap />);
    expect(screen.queryByTestId("map-container")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "地圖" }));
    expect(screen.getByTestId("map-container")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "卡片" }));
    expect(screen.getByTestId("map-container")).toBeTruthy();
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(true);
    expect(
      container.querySelector("#play-map-panel-cards")?.hasAttribute("hidden"),
    ).toBe(false);
  });

  it("開啟 Sheet 後可按關閉還原", () => {
    render(<PlayMap />);
    const firstPlace = filterPlaygrounds()[0];
    expect(firstPlace).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: `${firstPlace.name}，查看詳情` }),
    );
    expect(
      screen.getByRole("region", { name: `${firstPlace.name} 詳情` }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "關閉地點詳情" }));
    expect(
      screen.queryByRole("region", { name: `${firstPlace.name} 詳情` }),
    ).toBeNull();
  });

  it("開啟 Sheet 後按 Esc 可關閉", () => {
    render(<PlayMap />);
    const firstPlace = filterPlaygrounds()[0];
    expect(firstPlace).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: `${firstPlace.name}，查看詳情` }),
    );
    expect(
      screen.getByRole("region", { name: `${firstPlace.name} 詳情` }),
    ).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("region", { name: `${firstPlace.name} 詳情` }),
    ).toBeNull();
  });

  it("涵蓋區顯示年齡定位與 coverageHeadline 文案", () => {
    render(<PlayMap />);
    // 年齡改在此講一次（卡片層已移除重複標籤），依實際資料推導而非寫死。
    const coverage = screen.getByText(
      new RegExp(`適合 \\d+–\\d+ 歲 · ${coverageHeadline()}`),
    );
    expect(coverage).toBeTruthy();
  });

  it("篩選狀態寫回網址，預設值不入 query", () => {
    render(<PlayMap />);

    fireEvent.click(screen.getByRole("button", { name: "免費放電" }));
    expect(replaceMock).toHaveBeenCalledWith(
      "/for-parents/play-map?free=1",
      { scroll: false },
    );

    fireEvent.click(screen.getByRole("tab", { name: "地圖" }));
    expect(replaceMock).toHaveBeenCalledWith(
      "/for-parents/play-map?free=1&view=map",
      { scroll: false },
    );

    fireEvent.click(screen.getByRole("button", { name: "免費放電" }));
    expect(replaceMock).toHaveBeenLastCalledWith(
      "/for-parents/play-map?view=map",
      { scroll: false },
    );
  });

  it("依網址參數還原首屏狀態", () => {
    const indoorFreeCount = filterPlaygrounds({
      city: "新北市",
      indoorOnly: true,
      freeOnly: true,
    }).length;

    render(
      <PlayMap
        initialCity="新北市"
        initialIndoorOnly
        initialFreeOnly
        initialView="map"
      />,
    );

    expect(
      screen.getByText(
        summaryText("新北市", indoorFreeCount, ["室內", "免費"]),
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("tab", { name: "地圖" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("上一頁／下一頁換 initial props 時同步回 state", () => {
    const { rerender } = render(<PlayMap initialCity="台北市" />);
    expect(
      screen.getByText(
        summaryText("台北市", filterPlaygrounds({ city: "台北市" }).length),
      ),
    ).toBeTruthy();

    rerender(<PlayMap initialCity="桃園市" initialFreeOnly />);

    expect(
      screen.getByText(
        summaryText(
          "桃園市",
          filterPlaygrounds({ city: "桃園市", freeOnly: true }).length,
          ["免費"],
        ),
      ),
    ).toBeTruthy();
  });

  it("SSR 渲染全部地點，未命中者掛 hidden", () => {
    const { container } = render(<PlayMap initialCity="台北市" />);
    const all = listPlaygrounds();
    const matched = filterPlaygrounds({ city: "台北市" });

    const items = container.querySelectorAll("#play-map-panel-cards li");
    expect(items.length).toBe(all.length);
    expect(
      [...items].filter((li) => !li.hasAttribute("hidden")).length,
    ).toBe(matched.length);
  });

  it("0 筆的類型 chip 隱藏", () => {
    render(<PlayMap initialCity="台北市" />);
    openFilters();
    const emptyType = PLAYGROUND_TYPES.find(
      (type) =>
        filterPlaygrounds({ city: "台北市", type }).length === 0,
    );
    expect(emptyType).toBeDefined();
    if (!emptyType) return;

    expect(
      screen.queryByRole("button", { name: typeChipName(emptyType, 0) }),
    ).toBeNull();
  });

  /**
   * 年齡標籤已從卡片移到 toolbar（全站每筆同一區間，73 張卡各講一次是噪音）。
   * 「需購票／戶外」不得出現的斷言**保留**——那是反向 muted 標籤，另一回事。
   */
  it("卡片不再重複年齡標籤，且仍不含需購票／戶外 muted", () => {
    render(<PlayMap />);
    const cardsPanel = screen.getByRole("tabpanel", { name: "卡片" });
    expect(within(cardsPanel).queryAllByText(/^\d+–\d+ 歲$/)).toHaveLength(0);
    expect(within(cardsPanel).queryByText("需購票")).toBeNull();
    expect(within(cardsPanel).queryByText("戶外")).toBeNull();
  });

  it("卡片以文字標示類型，不只靠色條（色彩單一編碼）", () => {
    render(<PlayMap />);
    const cardsPanel = screen.getByRole("tabpanel", { name: "卡片" });
    const first = filterPlaygrounds()[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(
      within(cardsPanel).getAllByText(new RegExp(first.type)).length,
    ).toBeGreaterThan(0);
    expect(
      cardsPanel.querySelector(
        `[data-type="${playgroundTypeVisualKey(first.type)}"][data-scene] svg`,
      ),
    ).toBeTruthy();
  });

  it("tabs 支援方向鍵切換", () => {
    render(<PlayMap />);
    const cardsTab = screen.getByRole("tab", { name: "卡片" });
    const mapTab = screen.getByRole("tab", { name: "地圖" });

    expect(cardsTab.getAttribute("tabindex")).toBe("0");
    expect(mapTab.getAttribute("tabindex")).toBe("-1");

    fireEvent.keyDown(cardsTab, { key: "ArrowRight" });

    expect(mapTab.getAttribute("aria-selected")).toBe("true");
    expect(mapTab.getAttribute("tabindex")).toBe("0");
    expect(cardsTab.getAttribute("tabindex")).toBe("-1");
  });

  it("篩選導致 Sheet 關閉時不搶 focus", () => {
    render(<PlayMap />);
    const paidPlace = filterPlaygrounds().find((place) => !place.free);
    expect(paidPlace).toBeDefined();
    if (!paidPlace) return;

    // 無定位時排序為「免費優先」，付費地點必然落在首批之外；先展開再取。
    showAllCards();

    fireEvent.click(
      screen.getByRole("button", { name: `${paidPlace.name}，查看詳情` }),
    );
    expect(
      screen.getByRole("region", { name: `${paidPlace.name} 詳情` }),
    ).toBeTruthy();

    const freeChip = screen.getByRole("button", { name: "免費放電" });
    freeChip.focus();
    fireEvent.click(freeChip);
    expect(
      screen.queryByRole("region", { name: `${paidPlace.name} 詳情` }),
    ).toBeNull();
    expect(document.activeElement).toBe(freeChip);
  });

  it("分批顯示：DOM 恆為全量，僅可見數受批次限制（禁止 slice）", () => {
    const { container } = render(<PlayMap />);
    const all = listPlaygrounds();
    const items = container.querySelectorAll("#play-map-panel-cards li");
    const visible = [...items].filter((li) => !li.hasAttribute("hidden"));

    expect(items.length).toBe(all.length);
    expect(visible.length).toBe(VISIBLE_STEP);
  });

  /**
   * 紅線：導航 CTA 永不消失。只斷言「可見卡都有導航」等於沒斷言——
   * slice 會讓未顯示的卡連同其導航連結一起從 DOM 消失而測試仍全綠。
   */
  it("每一筆地點在 DOM 中都保有導航連結（含未顯示與未命中）", () => {
    const { container } = render(<PlayMap />);
    const navLinks = container.querySelectorAll(
      '#play-map-panel-cards a[href^="https://www.google.com/maps/dir/"]',
    );
    expect(navLinks.length).toBe(listPlaygrounds().length);

    const coordOnly = /^-?\d+(\.\d+)?,\s*-?\d+/;
    const expectedByQuery = new Map(
      listPlaygrounds().map((place) => [
        place.mapsQuery ?? `${place.name}, ${place.city}`,
        place,
      ]),
    );
    const seen = new Set<string>();
    for (const link of navLinks) {
      const dest = new URL(link.getAttribute("href") ?? "").searchParams.get(
        "destination",
      );
      expect(dest).toBeTruthy();
      expect(dest).not.toMatch(coordOnly);
      const place = dest ? expectedByQuery.get(dest) : undefined;
      expect(place, dest ?? "").toBeDefined();
      if (dest) seen.add(dest);
    }
    expect(seen.size).toBe(listPlaygrounds().length);
  });

  it("載入更多會擴批，且到底時按鈕消失", () => {
    const { container } = render(<PlayMap />);
    const total = filterPlaygrounds().length;

    fireEvent.click(screen.getByRole("button", { name: "載入更多" }));
    const visible = [
      ...container.querySelectorAll("#play-map-panel-cards li"),
    ].filter((li) => !li.hasAttribute("hidden"));
    expect(visible.length).toBe(Math.min(VISIBLE_STEP * 2, total));

    showAllCards();
    expect(screen.queryByRole("button", { name: "載入更多" })).toBeNull();
  });

  it("「載入更多」以命中數為準，不是全站總數", () => {
    render(<PlayMap />);
    openFilters();
    const themeCount = filterPlaygrounds({ type: "主題樂園" }).length;
    expect(themeCount).toBeLessThan(VISIBLE_STEP);

    fireEvent.click(
      screen.getByRole("button", {
        name: typeChipName("主題樂園", themeCount),
      }),
    );

    // 命中數 < 一批，即使全站有 73 筆也不該出現無效的「載入更多」。
    expect(screen.queryByRole("button", { name: "載入更多" })).toBeNull();
  });

  it("篩選變更會把批次歸零", () => {
    const { container } = render(<PlayMap />);
    showAllCards();
    fireEvent.click(screen.getByRole("button", { name: "免費放電" }));

    const visible = [
      ...container.querySelectorAll("#play-map-panel-cards li"),
    ].filter((li) => !li.hasAttribute("hidden"));
    expect(visible.length).toBe(VISIBLE_STEP);
  });

  it("全國未縮小範圍時提示選縣市或離我最近", () => {
    render(<PlayMap />);
    expect(screen.getByText(/目前顯示全台收錄/)).toBeTruthy();

    openFilters();
    fireEvent.click(
      within(screen.getByRole("group", { name: "依縣市篩選" })).getByRole(
        "button",
        { name: cityChipName("台北市") },
      ),
    );
    expect(screen.queryByText(/目前顯示全台收錄/)).toBeNull();
  });

  it("在地圖看會切到地圖、帶入該縣市並開精簡詳情", () => {
    const { container } = render(<PlayMap />);
    const firstPlace = filterPlaygrounds()[0];
    expect(firstPlace).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: `在地圖上看 ${firstPlace.name}` }),
    );

    expect(
      screen.getByRole("tab", { name: "地圖" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(false);
    const sheet = screen.getByRole("region", {
      name: `${firstPlace.name} 詳情`,
    });
    expect(sheet).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: "更多" })).toBeTruthy();
    expect(within(sheet).getByText(firstPlace.address, { exact: false })).toBeTruthy();
    expect(
      within(screen.getByRole("group", { name: "依縣市篩選" })).getByRole(
        "button",
        { name: cityChipName(firstPlace.city) },
      ).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("桌面並排時名單與地圖同時可見、不顯示互斥分頁", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion")
          ? false
          : query.includes("min-width: 640px") ||
            query.includes("min-width: 980px"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { container } = render(<PlayMap />);
    expect(screen.queryByRole("tab", { name: "卡片" })).toBeNull();
    expect(screen.getByRole("region", { name: "地點名單" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "地點地圖" })).toBeTruthy();
    expect(
      container.querySelector("#play-map-panel-cards")?.hasAttribute("hidden"),
    ).toBe(false);
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(false);
    expect(screen.getByTestId("map-container")).toBeTruthy();
  });
});
