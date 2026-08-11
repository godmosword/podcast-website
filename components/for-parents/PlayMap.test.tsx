// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { filterPlaygrounds } from "@/lib/playgrounds-query";
import {
  coverageHeadline,
  DEFAULT_PLAY_MAP_CITY,
  listCityCoverage,
} from "@/lib/playground-coverage";
import PlayMap from "./PlayMap";

vi.stubGlobal("React", React);

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
      matches: query.includes("prefers-reduced-motion"),
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
});

function cityChipName(city: string): RegExp {
  const count = listCityCoverage().find((row) => row.city === city)?.count;
  return count !== undefined
    ? new RegExp(`^${city} · ${count}$`)
    : new RegExp(`^${city}$`);
}

function summaryText(city: string, count: number, extras: string[] = []): string {
  const parts = [city, ...extras];
  return `${parts.join(" · ")} → ${count} 個地點`;
}

describe("PlayMap", () => {
  it("預設選取台北市與卡片瀏覽", () => {
    render(<PlayMap />);
    expect(
      screen.getByRole("heading", { level: 1, name: "親子遊樂地圖" }),
    ).toBeTruthy();

    const cityGroup = screen.getByRole("group", { name: "依縣市篩選" });
    const pressed = within(cityGroup).getByRole("button", {
      name: cityChipName(DEFAULT_PLAY_MAP_CITY),
    });
    expect(pressed.getAttribute("aria-pressed")).toBe("true");

    expect(screen.getByRole("tab", { name: "卡片" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("tabpanel", { name: "卡片" }).hasAttribute("hidden")).toBe(
      false,
    );
  });

  it("切換免費篩選會改變結果數", () => {
    render(<PlayMap />);
    const baseline = filterPlaygrounds({ city: DEFAULT_PLAY_MAP_CITY }).length;
    const freeCount = filterPlaygrounds({
      city: DEFAULT_PLAY_MAP_CITY,
      freeOnly: true,
    }).length;

    expect(
      screen.getByText(summaryText(DEFAULT_PLAY_MAP_CITY, baseline)),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "免費" }));

    expect(
      screen.getByText(summaryText(DEFAULT_PLAY_MAP_CITY, freeCount, ["免費"])),
    ).toBeTruthy();
  });

  it("類型篩選會縮小結果", () => {
    render(<PlayMap />);
    const parkCount = filterPlaygrounds({
      city: DEFAULT_PLAY_MAP_CITY,
      type: "公園",
    }).length;

    fireEvent.click(screen.getByRole("button", { name: "公園" }));

    expect(
      screen.getByText(summaryText(DEFAULT_PLAY_MAP_CITY, parkCount, ["公園"])),
    ).toBeTruthy();
  });

  it("清除條件保留縣市並還原類型／進階篩選", () => {
    render(<PlayMap />);
    const baseline = filterPlaygrounds({ city: DEFAULT_PLAY_MAP_CITY }).length;

    fireEvent.click(screen.getByRole("button", { name: "公園" }));
    fireEvent.click(screen.getByRole("button", { name: "免費" }));

    expect(screen.getByRole("button", { name: "清除條件" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "清除條件" }));

    expect(
      screen.getByText(summaryText(DEFAULT_PLAY_MAP_CITY, baseline)),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "清除條件" })).toBeNull();
    expect(
      within(screen.getByRole("group", { name: "依縣市篩選" })).getByRole(
        "button",
        { name: cityChipName(DEFAULT_PLAY_MAP_CITY) },
      ).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("可切換至地圖瀏覽", () => {
    const { container } = render(<PlayMap />);
    fireEvent.click(screen.getByRole("tab", { name: "地圖" }));

    expect(screen.getByRole("tab", { name: "地圖" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(container.querySelector("#play-map-panel-map")?.hasAttribute("hidden")).toBe(
      false,
    );
    expect(container.querySelector("#play-map-panel-cards")?.hasAttribute("hidden")).toBe(
      true,
    );
    expect(screen.getByTestId("map-container")).toBeTruthy();
  });

  it("開啟 Sheet 後可按關閉還原", () => {
    render(<PlayMap />);
    const firstPlace = filterPlaygrounds({ city: DEFAULT_PLAY_MAP_CITY })[0];
    expect(firstPlace).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(firstPlace.name) }),
    );
    expect(screen.getByRole("region", { name: `${firstPlace.name} 詳情` })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "關閉地點詳情" }));
    expect(
      screen.queryByRole("region", { name: `${firstPlace.name} 詳情` }),
    ).toBeNull();
  });

  it("開啟 Sheet 後按 Esc 可關閉", () => {
    render(<PlayMap />);
    const firstPlace = filterPlaygrounds({ city: DEFAULT_PLAY_MAP_CITY })[0];
    expect(firstPlace).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(firstPlace.name) }),
    );
    expect(screen.getByRole("region", { name: `${firstPlace.name} 詳情` })).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("region", { name: `${firstPlace.name} 詳情` }),
    ).toBeNull();
  });

  it("涵蓋區顯示 coverageHeadline 文案", () => {
    render(<PlayMap />);
    expect(screen.getByText(coverageHeadline())).toBeTruthy();
  });

  it("篩選導致 Sheet 關閉時不搶 focus", () => {
    render(<PlayMap />);
    const paidPlace = filterPlaygrounds({ city: DEFAULT_PLAY_MAP_CITY }).find(
      (place) => !place.free,
    );
    expect(paidPlace).toBeDefined();
    if (!paidPlace) return;

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(paidPlace.name) }),
    );
    expect(screen.getByRole("region", { name: `${paidPlace.name} 詳情` })).toBeTruthy();

    const freeChip = screen.getByRole("button", { name: "免費" });
    freeChip.focus();
    fireEvent.click(freeChip);
    expect(
      screen.queryByRole("region", { name: `${paidPlace.name} 詳情` }),
    ).toBeNull();
    expect(document.activeElement).toBe(freeChip);
  });
});
