// @vitest-environment jsdom
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listPlaygrounds, PLAYGROUND_TYPES, getPlayground } from "@/data/playgrounds";
import { filterPlaygrounds } from "@/lib/playgrounds-query";
import { coverageHeadline } from "@/lib/playground-coverage";
import { composeParentBlurb } from "@/lib/playground-parent-voice";
import { VISIBLE_STEP } from "./PlayMapContract";
import PlayMap from "./PlayMap";

vi.stubGlobal("React", React);

/**
 * 結果列 h2 視覺上拆成「在 X 找 Y」＋放大的結果數，
 * accessible name 由 srText 提供，所以斷言走 aria-label 而非 textContent。
 */
const RESULT_HEADING = /^在.+，共 \d+ (個地方|處)$/;

function expectResultScopeCount(
  scope: string,
  count: number,
  /** 手機地圖模式時名單整區 hidden，結果列不在 a11y tree，需明說要找隱藏節點。 */
  options: { hidden?: boolean } = {},
) {
  const label =
    screen
      .getByRole("heading", {
        level: 2,
        name: RESULT_HEADING,
        hidden: options.hidden ?? false,
      })
      .getAttribute("aria-label") ?? "";
  expect(label.startsWith(`在${scope}`)).toBe(true);
  // 單一情境時量詞是「處」，其餘是「個地方」。
  expect(label).toMatch(new RegExp(`共 ${count} (個地方|處)$`));
}

let replaceStateSpy!: ReturnType<typeof vi.spyOn>;

type MockLeafletProps = {
  places: readonly unknown[];
  selectedId: string | null;
  hoveredPlaceId: string | null;
  onSelect: (id: string, trigger: HTMLElement) => void;
  onHover: (id: string) => void;
  onBlur: (id: string) => void;
  preserveViewport: boolean;
  onViewportSettled: (
    snapshot: {
      bounds: {
        south: number;
        west: number;
        north: number;
        east: number;
      };
      zoom: number;
    },
    source: "user" | "programmatic",
  ) => void;
};

const leafletPropsRef = vi.hoisted(() => ({
  current: null as MockLeafletProps | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/for-parents/play-map",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockPlayMapLeaflet(props: MockLeafletProps) {
      leafletPropsRef.current = props;
      return (
        <div
          data-testid="map-container"
          data-selected-id={props.selectedId ?? ""}
          data-hovered-id={props.hoveredPlaceId ?? ""}
        />
      );
    },
}));

beforeEach(() => {
  // jsdom 沒實作 scrollTo；選縣市面板解除捲動鎖時會呼叫。
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  replaceStateSpy = vi.spyOn(window.history, "replaceState");
  leafletPropsRef.current = null;
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
  replaceStateSpy.mockRestore();
});

function replaceStateUrls(): string[] {
  return replaceStateSpy.mock.calls.map(([, , url]) => String(url ?? ""));
}

function typeChipName(type: string, count: number): RegExp {
  return new RegExp(`^${type}，${count} 個地點$`);
}

function openFilters() {
  const toggle = screen.getByRole("button", { name: /^更多條件/ });
  if (toggle.getAttribute("aria-expanded") !== "true") {
    fireEvent.click(toggle);
  }
}

/** 反覆點「再看 N 個」直到全部命中卡片都可見。 */
function showAllCards(): void {
  for (let i = 0; i < 20; i += 1) {
    const more = screen.queryByRole("button", { name: /^再看 \d+ 個$/ });
    if (!more) return;
    fireEvent.click(more);
  }
}

function openMap(): void {
  if (!screen.queryByRole("button", { name: "看地圖" })) {
    selectCityFromWall();
  }
  fireEvent.click(screen.getByRole("button", { name: "看地圖" }));
}

/** 位置列「全台 ▾」→ 選縣市面板 → 點縣市（面板選完自動關閉）。 */
function selectCityFromWall(city = "台北市"): void {
  fireEvent.click(screen.getByRole("button", { name: /^選擇地點，目前：/ }));
  const dialog = screen.getByRole("dialog", { name: "去哪裡玩？" });
  fireEvent.click(
    within(dialog).getByRole("button", { name: new RegExp(`^${city}，\\d+ 個地點$`) }),
  );
}

/** 情境卡的 accessible name 是「下雨也能玩，全台 34 處」。 */
function scenarioCard(label: string): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(`^${label}，`) });
}

function backToList(): void {
  fireEvent.click(screen.getByRole("button", { name: "返回名單" }));
}

function cardFlagLabels(placeId: string): string[] {
  const card = document.getElementById(placeId);
  return [...(card?.querySelectorAll("[data-card-fact]") ?? [])].map(
    (node) => node.textContent ?? "",
  );
}

function mockDesktopMatchMedia(reducedMotion = false): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion")
        ? reducedMotion
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
}

describe("PlayMap", () => {
  it("首屏：h1、「今天想怎麼玩？」、四張情境卡與位置列；選縣市後才有看地圖", () => {
    render(<PlayMap />);
    expect(
      screen.getByRole("heading", { level: 1, name: "親子遊樂地圖" }),
    ).toBeTruthy();
    expect(screen.getByText("今天想怎麼玩？")).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "卡片" })).toBeNull();
    expect(screen.queryByRole("button", { name: "看地圖" })).toBeNull();

    const cards = within(screen.getByRole("group", { name: "今天想怎麼玩" })).getAllByRole(
      "button",
    );
    expect(cards.map((card) => card.dataset.scenario)).toEqual([
      "rainy",
      "energy",
      "exhibit",
      "free",
    ]);
    expect(cards.every((card) => card.getAttribute("aria-pressed") === "false")).toBe(true);

    // 位置列：「在［全台 ▾］或［我附近］」；縣市在面板裡，預設不展開。
    expect(screen.getByRole("button", { name: "選擇地點，目前：全台" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "我附近" }).dataset.quickFilter).toBe("nearby");
    expect(screen.queryByRole("dialog")).toBeNull();

    selectCityFromWall();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "選擇地點，目前：台北市" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "看地圖" })).toBeTruthy();
  });

  it("情境卡：數字＝選了之後的結果數；再點一次取消；換一張只留一個情境", () => {
    render(<PlayMap />);
    const rainyCount = filterPlaygrounds({ rainyDayOnly: true }).length;
    const energyCount = filterPlaygrounds({ highEnergyOnly: true }).length;
    expect(scenarioCard("下雨也能玩").getAttribute("aria-label")).toBe(
      `下雨也能玩，全台 ${rainyCount} 處`,
    );

    fireEvent.click(scenarioCard("下雨也能玩"));
    expect(scenarioCard("下雨也能玩").getAttribute("aria-pressed")).toBe("true");
    expectResultScopeCount("全台", rainyCount);
    expect(
      screen.getByRole("heading", { level: 2, name: RESULT_HEADING }).textContent,
    ).toContain(`全台下雨也能玩 · ${rainyCount} 處`);
    expect(replaceStateUrls().at(-1)).toBe("/for-parents/play-map?rain=1");

    fireEvent.click(scenarioCard("跑跳放電"));
    expect(scenarioCard("下雨也能玩").getAttribute("aria-pressed")).toBe("false");
    expect(scenarioCard("跑跳放電").getAttribute("aria-pressed")).toBe("true");
    expectResultScopeCount("全台", energyCount);
    expect(replaceStateUrls().at(-1)).toBe("/for-parents/play-map?energy=1");

    fireEvent.click(scenarioCard("跑跳放電"));
    expect(scenarioCard("跑跳放電").getAttribute("aria-pressed")).toBe("false");
    expectResultScopeCount("全台", listPlaygrounds().length);
  });

  it("看展覽＝類型博物館；卡片理由行只引用資料原詞", () => {
    render(<PlayMap />);
    fireEvent.click(scenarioCard("看展覽"));
    expect(replaceStateUrls().at(-1)).toBe(
      `/for-parents/play-map?type=${encodeURIComponent("博物館")}`,
    );
    expectResultScopeCount("全台", filterPlaygrounds({ type: "博物館" }).length);
    showAllCards();
    const reason = document
      .getElementById("tp-ntsec")
      ?.querySelector("[data-card-reason]")?.textContent;
    expect(reason).toBe("看展：互動展、3D 劇院");
  });

  it("網址同時帶多個情境：不亮任何卡，結果列下方逐項列出可取消的 chip", () => {
    render(<PlayMap initialFreeOnly initialRainyDayOnly />);
    const cards = within(screen.getByRole("group", { name: "今天想怎麼玩" })).getAllByRole(
      "button",
    );
    expect(cards.every((card) => card.getAttribute("aria-pressed") === "false")).toBe(true);
    const chips = within(screen.getByRole("group", { name: "目前套用的情境" })).getAllByRole(
      "button",
    );
    expect(chips.map((chip) => chip.getAttribute("aria-label"))).toEqual([
      "取消「下雨也能玩」",
      "取消「免費就好」",
    ]);
    expectResultScopeCount(
      "全台",
      filterPlaygrounds({ freeOnly: true, rainyDayOnly: true }).length,
    );

    fireEvent.click(chips[0]!);
    expect(screen.queryByRole("group", { name: "目前套用的情境" })).toBeNull();
    expect(scenarioCard("免費就好").getAttribute("aria-pressed")).toBe("true");
  });

  it("切換免費會改變結果數", () => {
    render(<PlayMap />);
    const baseline = filterPlaygrounds().length;
    const freeCount = filterPlaygrounds({ freeOnly: true }).length;

    expectResultScopeCount("全台", baseline);

    fireEvent.click(scenarioCard("免費就好"));

    expectResultScopeCount("全台", freeCount);
  });

  it("有明確縣市與至少兩筆結果時顯示媽米先幫你看，點擊沿用既有詳情", () => {
    render(<PlayMap initialCity="桃園市" />);

    expect(
      screen.getByRole("heading", { level: 3, name: "媽米先幫你看" }),
    ).toBeTruthy();
    const editorial = screen.getByRole("region", {
      name: "媽米先幫你看",
    });
    expect(within(editorial).getByText("桃園市立兒童美術館")).toBeTruthy();
    expect(
      screen.getByText("室內展覽與創作體驗；免費入場，雨天也有備案。"),
    ).toBeTruthy();

    fireEvent.click(within(editorial).getByRole("button", { name: /看看這個/ }));
    const sheet = screen.getByRole("region", {
      name: "桃園市立兒童美術館 詳情",
    });
    expect(sheet.getAttribute("data-variant")).toBe("full");
    expect(
      within(sheet).getByRole("link", { name: "查看完整資訊" }).getAttribute(
        "href",
      ),
    ).toBe("/for-parents/play-map/ty-kids-museum");
  });

  it("全台初始與單筆結果不顯示 editorial recommendation", () => {
    const { rerender } = render(<PlayMap />);
    expect(screen.queryByText("媽米先幫你看")).toBeNull();

    rerender(<PlayMap initialCity="桃園市" initialType="主題樂園" />);
    expect(screen.queryByText("媽米先幫你看")).toBeNull();
  });

  it("切換縣市後 recommendation 立即離開舊的 final result set", () => {
    render(<PlayMap initialCity="桃園市" />);
    expect(screen.getByText("媽米先幫你看")).toBeTruthy();

    selectCityFromWall("台北市");

    expect(screen.queryByText("媽米先幫你看")).toBeNull();
  });

  it("recommendation 跟著更多條件（室內）的 final result 重算", () => {
    render(<PlayMap initialCity="桃園市" />);
    openFilters();
    fireEvent.click(screen.getByRole("button", { name: "室內" }));

    const editorial = screen.getByRole("region", {
      name: "媽米先幫你看",
    });
    expect(within(editorial).getByText("桃園市立兒童美術館")).toBeTruthy();
  });

  it("recommendation 跟著 advanced parking filter 重算", () => {
    render(<PlayMap initialCity="新北市" />);
    openFilters();
    fireEvent.click(screen.getByRole("button", { name: "好停車" }));

    const editorial = screen.getByRole("region", {
      name: "媽米先幫你看",
    });
    expect(within(editorial).getByText("林口運動公園")).toBeTruthy();
  });

  it("desktop 結果欄顯示 editorial recommendation", () => {
    mockDesktopMatchMedia();
    render(<PlayMap initialCity="桃園市" />);

    const list = screen.getByRole("region", { name: "地點名單" });
    expect(
      within(list).getByRole("heading", {
        level: 3,
        name: "媽米先幫你看",
      }),
    ).toBeTruthy();
  });

  it("「更多條件」徽章只數面板裡的條件，情境與縣市不算", () => {
    render(<PlayMap />);

    expect(
      screen
        .getByRole("heading", { level: 2, name: RESULT_HEADING })
        .getAttribute("aria-label"),
    ).toMatch(/^在全台.*共 \d+ 個地方$/);
    expect(screen.queryByRole("button", { name: "看地圖" })).toBeNull();

    // 徽章只數面板裡的條件：選縣市、選情境（含看展覽的博物館）都不算。
    selectCityFromWall("台北市");
    fireEvent.click(scenarioCard("看展覽"));
    expect(screen.getByRole("button", { name: "更多條件" })).toBeTruthy();

    openFilters();
    fireEvent.click(screen.getByRole("button", { name: "好停車" }));
    fireEvent.click(screen.getByRole("button", { name: "室內" }));
    expect(
      screen.getByRole("button", { name: "更多條件，已套用 2 個" }),
    ).toBeTruthy();
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

    expectResultScopeCount("全台", themeCount);
  });

  it("縣市只在選縣市面板；更多條件預設不展開，含環境、親子條件、類型", () => {
    render(<PlayMap />);
    expect(screen.queryByRole("group", { name: "依縣市瀏覽" })).toBeNull();
    expect(screen.queryByRole("group", { name: "依類型篩選" })).toBeNull();

    openFilters();
    expect(screen.queryByRole("group", { name: "依縣市瀏覽" })).toBeNull();
    expect(screen.getByRole("group", { name: "依類型篩選" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "親子條件" })).toBeTruthy();
    const environment = screen.getByRole("group", { name: "室內或戶外" });
    expect(within(environment).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "不限",
      "室內",
      "戶外",
    ]);
    // 每個條件只出現一次：情境卡不再和更多條件重複。
    expect(screen.getAllByRole("button", { name: "室內" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "好停車" })).toHaveLength(1);
  });

  it("環境「室內／戶外／不限」互斥", () => {
    render(<PlayMap />);
    openFilters();
    const outdoor = () => screen.getByRole("button", { name: "戶外" });
    const indoor = () => screen.getByRole("button", { name: "室內" });
    const outdoorCount = filterPlaygrounds({ outdoorOnly: true }).length;

    fireEvent.click(outdoor());
    expect(outdoor().getAttribute("aria-pressed")).toBe("true");
    expect(indoor().getAttribute("aria-pressed")).toBe("false");
    expectResultScopeCount("全台", outdoorCount);

    fireEvent.click(indoor());
    expect(indoor().getAttribute("aria-pressed")).toBe("true");
    expect(outdoor().getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "不限" }));
    expect(outdoor().getAttribute("aria-pressed")).toBe("false");
    expect(indoor().getAttribute("aria-pressed")).toBe("false");
    expectResultScopeCount("全台", listPlaygrounds().length);
  });

  it("類型篩選會縮小結果", () => {
    render(<PlayMap />);
    openFilters();
    const parkCount = filterPlaygrounds({ type: "公園" }).length;

    fireEvent.click(
      screen.getByRole("button", { name: typeChipName("公園", parkCount) }),
    );

    expectResultScopeCount("全台", parkCount);
  });

  it("清除條件保留縣市並還原類型／進階篩選", () => {
    render(<PlayMap />);
    selectCityFromWall("台北市");
    openFilters();

    const baseline = filterPlaygrounds({ city: "台北市" }).length;
    const parkCount = filterPlaygrounds({ city: "台北市", type: "公園" }).length;

    fireEvent.click(
      screen.getByRole("button", { name: typeChipName("公園", parkCount) }),
    );
    fireEvent.click(scenarioCard("免費就好"));

    expect(screen.getByRole("button", { name: "清除條件" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "清除條件" }));

    expectResultScopeCount("台北市", baseline);
    expect(screen.queryByRole("button", { name: "清除條件" })).toBeNull();
    expect(screen.getByRole("button", { name: "選擇地點，目前：台北市" })).toBeTruthy();
  });

  it("可切換至地圖瀏覽", () => {
    const { container } = render(<PlayMap />);
    openMap();

    expect(screen.getByRole("button", { name: "返回名單" })).toBeTruthy();
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(false);
    expect(
      container.querySelector("#play-map-panel-cards")?.hasAttribute("hidden"),
    ).toBe(true);
    expect(screen.getByTestId("map-container")).toBeTruthy();
  });

  it("名單首屏不掛地圖，切過地圖後再回名單仍保持掛載", () => {
    const { container } = render(<PlayMap />);
    expect(screen.queryByTestId("map-container")).toBeNull();

    openMap();
    expect(screen.getByTestId("map-container")).toBeTruthy();

    backToList();
    expect(screen.getByTestId("map-container")).toBeTruthy();
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(true);
    expect(
      container.querySelector("#play-map-panel-cards")?.hasAttribute("hidden"),
    ).toBe(false);
  });

  it("手機地圖模式沒有 bottom sheet，改由返回名單離開", () => {
    render(<PlayMap />);
    expect(screen.queryByRole("region", { name: "地圖結果" })).toBeNull();
    openMap();
    expect(screen.queryByRole("region", { name: "地圖結果" })).toBeNull();
    expect(screen.getByRole("button", { name: "返回名單" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "附近" })).toBeNull();
  });

  it("editorial recommendation 不在地圖模式重複出現", () => {
    render(<PlayMap initialCity="桃園市" />);
    expect(screen.getByText("媽米先幫你看")).toBeTruthy();
    openMap();
    expect(screen.queryByText("媽米先幫你看")).toBeNull();
  });

  it("地圖標記選取開精簡詳情，不依賴列表 sheet", () => {
    render(<PlayMap />);
    openMap();
    const place = filterPlaygrounds({ city: "台北市" })[0];
    expect(place).toBeDefined();
    if (!place) return;
    const trigger = document.createElement("button");
    act(() => {
      leafletPropsRef.current?.onSelect(place.id, trigger);
    });

    const placeSheet = screen.getByRole("region", {
      name: `${place.name} 詳情`,
    });
    expect(placeSheet).toBeTruthy();
    expect(placeSheet.getAttribute("data-variant")).toBe("compact");
    expect(within(placeSheet).getByRole("button", { name: "更多" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "地圖結果" })).toBeNull();
  });

  it("手機標記選取開精簡預覽，返回名單後預覽關閉且選取清空", () => {
    render(<PlayMap />);
    openMap();
    const place = filterPlaygrounds({ city: "台北市" })[0];
    expect(place).toBeDefined();
    if (!place) return;
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    act(() => {
      leafletPropsRef.current?.onSelect(place.id, trigger);
    });

    const preview = screen.getByRole("region", { name: `${place.name} 詳情` });
    expect(preview.getAttribute("data-variant")).toBe("compact");
    expect(screen.getByTestId("map-container").getAttribute("data-selected-id")).toBe(
      place.id,
    );

    backToList();

    expect(screen.queryByRole("region", { name: `${place.name} 詳情` })).toBeNull();
    expect(screen.queryByRole("region", { name: /詳情$/ })).toBeNull();
    expect(screen.getByTestId("map-container").getAttribute("data-selected-id")).toBe(
      "",
    );
    expect(screen.getByTestId("map-container").getAttribute("data-hovered-id")).toBe(
      "",
    );
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "看地圖" }),
    );
    expect(preview.isConnected).toBe(false);
  });

  it("開啟 Sheet 後可按關閉還原", () => {
    render(<PlayMap />);
    showAllCards();
    const firstPlace = filterPlaygrounds()[0];
    expect(firstPlace).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: `${firstPlace.name}，查看詳情` }),
    );
    const sheet = screen.getByRole("region", { name: `${firstPlace.name} 詳情` });
    expect(sheet).toBeTruthy();
    expect(within(sheet).getByText("帶小孩時")).toBeTruthy();
    expect(within(sheet).getByText(/資料於 \d{4} 年 \d{1,2} 月核對/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "關閉地點詳情" }));
    expect(
      screen.queryByRole("region", { name: `${firstPlace.name} 詳情` }),
    ).toBeNull();
  });

  it("開啟 Sheet 後按 Esc 可關閉", () => {
    render(<PlayMap />);
    showAllCards();
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

  it("選中有 coverageNote 的場館時 sheet 顯示資料範圍", () => {
    render(<PlayMap />);
    showAllCards();
    const hukou = getPlayground("hcx-hukou-sports");
    expect(hukou?.coverageNote).toBeDefined();
    if (!hukou?.coverageNote) return;

    fireEvent.click(
      screen.getByRole("button", { name: `${hukou.name}，查看詳情` }),
    );
    const sheet = screen.getByRole("region", { name: `${hukou.name} 詳情` });
    expect(within(sheet).getByText("資料範圍")).toBeTruthy();
    expect(within(sheet).getByText(hukou.coverageNote)).toBeTruthy();
  });

  it("選中 hc-nanliao 時 sheet 顯示 coverageNote，tips 不含導航落點", () => {
    render(<PlayMap />);
    showAllCards();
    const nanliao = getPlayground("hc-nanliao");
    expect(nanliao?.coverageNote).toBeDefined();
    if (!nanliao?.coverageNote) return;

    fireEvent.click(
      screen.getByRole("button", { name: `${nanliao.name}，查看詳情` }),
    );
    const sheet = screen.getByRole("region", { name: `${nanliao.name} 詳情` });
    expect(within(sheet).getByText("資料範圍")).toBeTruthy();
    expect(within(sheet).getByText(nanliao.coverageNote)).toBeTruthy();
    expect(nanliao.tips).not.toMatch(/導航會停在/);
    expect(within(sheet).queryByText(/導航會停在/)).toBeNull();
  });

  it("coverageNote 未定義時 sheet 不出現資料範圍區塊", () => {
    render(<PlayMap />);
    showAllCards();
    const firstPlace = filterPlaygrounds()[0];
    expect(firstPlace).toBeDefined();
    if (!firstPlace) return;
    expect(firstPlace.coverageNote).toBeUndefined();

    fireEvent.click(
      screen.getByRole("button", { name: `${firstPlace.name}，查看詳情` }),
    );
    const sheet = screen.getByRole("region", {
      name: `${firstPlace.name} 詳情`,
    });
    expect(within(sheet).queryByText("資料範圍")).toBeNull();
  });

  it("涵蓋區顯示年齡定位與 coverageHeadline 文案", () => {
    render(<PlayMap />);
    // 年齡改在此講一次（卡片層已移除重複標籤），依實際資料推導而非寫死。
    const coverage = screen.getByText(
      new RegExp(
        `適合 \\d+–\\d+ 歲 · ${coverageHeadline().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      ),
    );
    expect(coverage).toBeTruthy();
  });

  it("篩選狀態寫回網址，預設值不入 query", () => {
    render(<PlayMap />);

    fireEvent.click(scenarioCard("免費就好"));
    expect(replaceStateUrls()).toContain("/for-parents/play-map?free=1");

    openMap();
    expect(replaceStateUrls()).toContain(
      "/for-parents/play-map?city=%E5%8F%B0%E5%8C%97%E5%B8%82&free=1&view=map",
    );

    backToList();
    fireEvent.click(scenarioCard("免費就好"));
    expect(replaceStateUrls().at(-1)).toBe(
      "/for-parents/play-map?city=%E5%8F%B0%E5%8C%97%E5%B8%82",
    );
  });

  it("replaceState 保留 App Router history.state，避免 filter 寫回觸發 useSearchParams restore", () => {
    const appRouterState = { __NA: true, keep: "tree" };
    window.history.replaceState(appRouterState, "", "/for-parents/play-map");
    replaceStateSpy.mockClear();

    render(<PlayMap />);
    fireEvent.click(scenarioCard("免費就好"));

    expect(replaceStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ __NA: true, keep: "tree" }),
      "",
      "/for-parents/play-map?free=1",
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

    expectResultScopeCount("新北市", indoorFreeCount, { hidden: true });
    expect(screen.getByRole("button", { name: "返回名單" })).toBeTruthy();
  });

  it("無縣市的 view=map 軟著陸名單並清掉網址", () => {
    window.history.replaceState(
      { __NA: true },
      "",
      "/for-parents/play-map?view=map&free=1",
    );
    replaceStateSpy.mockClear();
    render(<PlayMap initialView="map" initialFreeOnly />);

    expect(screen.queryByRole("button", { name: "返回名單" })).toBeNull();
    expect(screen.queryByTestId("map-container")).toBeNull();
    expect(screen.queryByRole("button", { name: "看地圖" })).toBeNull();
    expect(replaceStateUrls()).toContain("/for-parents/play-map?free=1");
  });

  it("上一頁／下一頁換 initial props 時同步回 state", () => {
    const { rerender } = render(<PlayMap initialCity="台北市" />);
    expectResultScopeCount("台北市", filterPlaygrounds({ city: "台北市" }).length);

    rerender(<PlayMap initialCity="桃園市" initialFreeOnly />);

    expectResultScopeCount(
      "桃園市",
      filterPlaygrounds({ city: "桃園市", freeOnly: true }).length,
    );
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

  it("每筆地點都有以 id 對應的 DOM 錨點，且包含場館名稱", () => {
    render(<PlayMap />);
    const place = listPlaygrounds()[0];
    const anchor = document.getElementById(place.id);

    expect(anchor).toBeTruthy();
    expect(anchor?.textContent).toContain(place.name);
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
   * 年齡標籤已從卡片移到 toolbar（全站每筆同一區間，重複講是噪音）。
   * 收費／室內外改為明示二元狀態，不再靠缺席讓使用者自己推。
   */
  it("卡片顯示家長筆記，且名單沒有在地圖看按鈕", () => {
    render(<PlayMap />);
    const cardsPanel = screen.getByRole("region", { name: "地點名單" });
    const first = filterPlaygrounds()[0];
    expect(first).toBeDefined();
    if (!first) return;
    // 名單卡只放 tips，不拼「有兒童遊戲場、有步道」設施句。
    expect(
      within(cardsPanel).getByText(
        composeParentBlurb(first, undefined, { includeFacilities: false }),
      ),
    ).toBeTruthy();
    expect(
      within(cardsPanel).queryByRole("button", {
        name: `在地圖上看 ${first.name}`,
      }),
    ).toBeNull();
  });

  it("卡片不再重複年齡標籤，並明示免費／需購票與室內／戶外", () => {
    render(<PlayMap />);
    showAllCards();
    const cardsPanel = screen.getByRole("region", { name: "地點名單" });
    expect(within(cardsPanel).queryAllByText(/^\d+–\d+ 歲$/)).toHaveLength(0);

    const cases = [
      filterPlaygrounds().find((place) => place.free && place.indoor),
      filterPlaygrounds().find((place) => place.free && !place.indoor),
      filterPlaygrounds().find((place) => !place.free && place.indoor),
      filterPlaygrounds().find((place) => !place.free && !place.indoor),
    ];
    expect(cases.every(Boolean)).toBe(true);
    for (const place of cases) {
      if (!place) return;
      expect(cardFlagLabels(place.id)).toEqual([
        place.free ? "免費" : "需購票",
        place.indoor ? "室內" : "戶外",
      ]);
      expect(cardFlagLabels(place.id).join()).not.toMatch(/\d|全票|NT\$|票價/);
    }

    const closed = listPlaygrounds().find(
      (place) => place.status === "temporarily-closed",
    );
    expect(closed).toBeDefined();
    if (!closed) return;
    expect(within(document.getElementById(closed.id)!).getByText("暫停營業")).toBeTruthy();
    expect(cardFlagLabels(closed.id)).toEqual([
      closed.free ? "免費" : "需購票",
      closed.indoor ? "室內" : "戶外",
    ]);
  });

  it("卡片是純文字卡：類型寫成文字，沒有類型插畫", () => {
    render(<PlayMap />);
    const cardsPanel = screen.getByRole("region", { name: "地點名單" });
    const first = filterPlaygrounds()[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(
      within(cardsPanel).getAllByText(new RegExp(first.type)).length,
    ).toBeGreaterThan(0);
    const card = document.getElementById(first.id)!;
    expect(card.querySelector("svg[viewBox='0 0 96 96']")).toBeNull();
    expect(card.querySelector("[data-scene]")).toBeNull();
  });

  it("看地圖與返回名單切換瀏覽模式", () => {
    const { container } = render(<PlayMap />);
    openMap();
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(false);
    backToList();
    expect(
      container.querySelector("#play-map-panel-cards")?.hasAttribute("hidden"),
    ).toBe(false);
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

    const freeChip = scenarioCard("免費就好");
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

    fireEvent.click(screen.getByRole("button", { name: /^再看 \d+ 個$/ }));
    const visible = [
      ...container.querySelectorAll("#play-map-panel-cards li"),
    ].filter((li) => !li.hasAttribute("hidden"));
    expect(visible.length).toBe(Math.min(VISIBLE_STEP * 2, total));

    showAllCards();
    expect(screen.queryByRole("button", { name: /^再看 \d+ 個$/ })).toBeNull();
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
    expect(screen.queryByRole("button", { name: /^再看 \d+ 個$/ })).toBeNull();
  });

  it("篩選變更會把批次歸零", () => {
    const { container } = render(<PlayMap />);
    showAllCards();
    fireEvent.click(scenarioCard("免費就好"));

    const visible = [
      ...container.querySelectorAll("#play-map-panel-cards li"),
    ].filter((li) => !li.hasAttribute("hidden"));
    expect(visible.length).toBe(VISIBLE_STEP);
  });

  it("全國未縮小範圍時用全台摘要，選縣市後改寫範圍", () => {
    render(<PlayMap />);
    expectResultScopeCount("全台", filterPlaygrounds({}).length);
    expect(
      screen.queryByText("先選「附近」或縣市，名單與地圖會更貼近今天的安排。"),
    ).toBeNull();

    selectCityFromWall("台北市");
    expectResultScopeCount("台北市", filterPlaygrounds({ city: "台北市" }).length);
  });

  it("在地圖看會切到地圖、帶入該縣市並開精簡詳情", () => {
    const { container } = render(<PlayMap />);
    showAllCards();
    const firstPlace = filterPlaygrounds()[0];
    expect(firstPlace).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: `${firstPlace.name}，查看詳情` }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: `在地圖上看 ${firstPlace.name}` }),
    );

    expect(screen.getByRole("button", { name: "返回名單" })).toBeTruthy();
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(false);
    const sheet = screen.getByRole("region", {
      name: `${firstPlace.name} 詳情`,
    });
    expect(sheet).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: "更多" })).toBeTruthy();
    expect(within(sheet).getByText(firstPlace.address, { exact: false })).toBeTruthy();
    backToList();
    expect(
      screen.queryByRole("region", { name: `${firstPlace.name} 詳情` }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: `選擇地點，目前：${firstPlace.city}` })).toBeTruthy();
  });

  it("桌面卡片 hover 與 focus 會同步對應 marker，離開後清除", () => {
    mockDesktopMatchMedia();
    render(<PlayMap initialCity="台北市" />);
    openMap();
    const place = filterPlaygrounds({ city: "台北市" })[0];
    expect(place).toBeDefined();
    if (!place) return;

    const card = document.getElementById(place.id);
    const article = card?.querySelector("article");
    const cardButton = card?.querySelector("button");
    expect(card).toBeTruthy();
    expect(article).toBeTruthy();
    expect(cardButton).toBeTruthy();
    if (!card || !article || !cardButton) return;

    fireEvent.pointerEnter(article);
    expect(card.dataset.cardState).toBe("hover-correlated");
    expect(leafletPropsRef.current?.hoveredPlaceId).toBe(place.id);

    fireEvent.pointerLeave(article);
    expect(card.dataset.cardState).toBe("default");
    expect(leafletPropsRef.current?.hoveredPlaceId).toBeNull();

    fireEvent.focus(cardButton);
    expect(card.dataset.cardState).toBe("hover-correlated");
    expect(leafletPropsRef.current?.hoveredPlaceId).toBe(place.id);
    fireEvent.blur(cardButton);
    expect(card.dataset.cardState).toBe("default");
    expect(leafletPropsRef.current?.hoveredPlaceId).toBeNull();
  });

  it("桌面選取與 hover 相關性不因手機返回名單清理而改變", () => {
    mockDesktopMatchMedia();
    render(<PlayMap initialCity="台北市" />);
    openMap();
    const place = filterPlaygrounds({ city: "台北市" })[0];
    expect(place).toBeDefined();
    if (!place) return;

    act(() => {
      leafletPropsRef.current?.onSelect(place.id, document.body);
    });
    expect(leafletPropsRef.current?.selectedId).toBe(place.id);
    expect(
      screen.getByRole("region", { name: `${place.name} 詳情` }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "返回名單" })).toBeNull();

    const card = document.getElementById(place.id);
    const article = card?.querySelector("article");
    expect(card?.dataset.cardState).toBe("selected");
    if (article) fireEvent.pointerEnter(article);
    expect(card?.dataset.cardState).toBe("selected");
    expect(leafletPropsRef.current?.selectedId).toBe(place.id);
    expect(leafletPropsRef.current?.hoveredPlaceId).toBe(place.id);
  });

  it("桌面 marker click 開 compact Sheet 並只捲動可見 card list", () => {
    mockDesktopMatchMedia();
    render(<PlayMap initialCity="台北市" />);
    openMap();
    const place = filterPlaygrounds({ city: "台北市" })[5];
    expect(place).toBeDefined();
    if (!place) return;

    const panel = screen.getByRole("region", { name: "地點名單" });
    const card = document.getElementById(place.id);
    expect(card).toBeTruthy();
    if (!card) return;

    const scrollTo = vi.fn();
    Object.defineProperty(panel, "clientHeight", {
      configurable: true,
      value: 200,
    });
    Object.defineProperty(panel, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 200,
    } as DOMRect);
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      top: 360,
      bottom: 440,
    } as DOMRect);

    act(() => {
      leafletPropsRef.current?.onSelect(place.id, document.body);
    });

    expect(
      screen.getByRole("region", { name: `${place.name} 詳情` }),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("region", { name: `${place.name} 詳情` })).getByRole(
        "button",
        { name: "更多" },
      ),
    ).toBeTruthy();
    expect(card.dataset.cardState).toBe("selected");
    expect(scrollTo).toHaveBeenCalledWith({ top: 240, behavior: "smooth" });
  });

  it("selected state 優先於 hover，且 filter 會清除失效 selection／hover", () => {
    mockDesktopMatchMedia();
    render(<PlayMap initialCity="台北市" />);
    openMap();
    const place = filterPlaygrounds({ city: "台北市" })[0];
    expect(place).toBeDefined();
    if (!place) return;

    act(() => {
      leafletPropsRef.current?.onSelect(place.id, document.body);
      leafletPropsRef.current?.onHover(place.id);
    });
    const card = document.getElementById(place.id);
    expect(card?.dataset.cardState).toBe("selected");
    expect(leafletPropsRef.current?.selectedId).toBe(place.id);
    expect(leafletPropsRef.current?.hoveredPlaceId).toBe(place.id);

    selectCityFromWall("桃園市");

    expect(
      screen.queryByRole("region", { name: `${place.name} 詳情` }),
    ).toBeNull();
    expect(leafletPropsRef.current?.selectedId).toBeNull();
    expect(leafletPropsRef.current?.hoveredPlaceId).toBeNull();
  });

  it("搜尋此區域只在 user movement 後出現，commit 後與 structured filter 使用 AND", () => {
    mockDesktopMatchMedia();
    const bounds = {
      south: 24.9,
      west: 121.0,
      north: 25.5,
      east: 122.0,
    };
    render(<PlayMap />);
    openMap();

    act(() => {
      leafletPropsRef.current?.onViewportSettled(
        { bounds, zoom: 8 },
        "programmatic",
      );
      leafletPropsRef.current?.onViewportSettled(
        {
          bounds: { ...bounds, south: 25.0 },
          zoom: 9,
        },
        "user",
      );
    });
    expect(screen.getByRole("button", { name: "搜尋此區域" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "搜尋此區域" }));
    const committedBounds = { ...bounds, south: 25.0 };
    const areaCount = filterPlaygrounds({
      city: "台北市",
      bounds: committedBounds,
    }).length;
    expect(areaCount).toBeGreaterThan(0);
    expectResultScopeCount("這個區域", areaCount);
    expect(leafletPropsRef.current?.places).toHaveLength(areaCount);
    expect(leafletPropsRef.current?.preserveViewport).toBe(true);

    fireEvent.click(scenarioCard("免費就好"));
    const freeAreaCount = filterPlaygrounds({
      city: "台北市",
      bounds: committedBounds,
      freeOnly: true,
    }).length;
    expectResultScopeCount("這個區域", freeAreaCount);
    expect(leafletPropsRef.current?.places).toHaveLength(freeAreaCount);

    fireEvent.click(screen.getByRole("button", { name: "看全台" }));
    expect(leafletPropsRef.current?.preserveViewport).toBe(false);
  });

  it("明確切換縣市會清除 stale viewport bounds", () => {
    mockDesktopMatchMedia();
    render(<PlayMap />);
    openMap();
    const bounds = {
      south: 24.9,
      west: 121.0,
      north: 25.5,
      east: 122.0,
    };
    act(() => {
      leafletPropsRef.current?.onViewportSettled(
        { bounds, zoom: 8 },
        "programmatic",
      );
      leafletPropsRef.current?.onViewportSettled(
        { bounds: { ...bounds, south: 25.0 }, zoom: 9 },
        "user",
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "搜尋此區域" }));

    selectCityFromWall("高雄市");
    expect(leafletPropsRef.current?.preserveViewport).toBe(false);
    expectResultScopeCount("高雄市", filterPlaygrounds({ city: "高雄市" }).length);
  });

  it("桌面預設只看名單且不掛地圖，看地圖後才並排", () => {
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

    // 桌面首屏也是名單：Leaflet 根本沒掛載，零 tile 請求。
    expect(screen.queryByTestId("map-container")).toBeNull();
    expect(screen.queryByRole("button", { name: "看地圖" })).toBeNull();
    selectCityFromWall();
    expect(screen.getByRole("button", { name: "看地圖" })).toBeTruthy();
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(true);

    openMap();

    // 切到地圖分頁才並排；名單留著，「看地圖」因為已同框而消失。
    expect(screen.getByRole("region", { name: "地點名單" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "地點地圖" })).toBeTruthy();
    expect(
      container.querySelector("#play-map-panel-cards")?.hasAttribute("hidden"),
    ).toBe(false);
    expect(
      container.querySelector("#play-map-panel-map")?.hasAttribute("hidden"),
    ).toBe(false);
    expect(screen.getByTestId("map-container")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "看地圖" })).toBeNull();
  });
});
