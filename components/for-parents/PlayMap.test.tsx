// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listCities } from "@/data/playgrounds";
import { filterPlaygrounds } from "@/lib/playgrounds-query";
import PlayMap from "./PlayMap";

vi.stubGlobal("React", React);

vi.mock("leaflet", () => {
  const latLngBounds = vi.fn(() => ({}));
  return {
    default: {
      icon: vi.fn(() => ({})),
      divIcon: vi.fn(() => ({})),
      latLngBounds,
      Marker: { prototype: { options: {} } },
    },
  };
});

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Marker: () => null,
  useMap: () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
  }),
}));

vi.mock("leaflet/dist/leaflet.css", () => ({}));

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

describe("PlayMap", () => {
  it("預設選取第一個縣市", () => {
    render(<PlayMap />);
    const select = screen.getByLabelText("依縣市篩選") as HTMLSelectElement;
    expect(select.value).toBe(listCities()[0]);
    expect(select.value).not.toBe("全部");
  });

  it("切換免費篩選會改變結果數", () => {
    render(<PlayMap />);
    const city = listCities()[0];
    const baseline = filterPlaygrounds({ city }).length;
    const freeCount = filterPlaygrounds({ city, freeOnly: true }).length;

    expect(screen.getByText(`找到 ${baseline} 個地點`)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "免費" }));

    expect(screen.getByText(`找到 ${freeCount} 個地點`)).toBeTruthy();
  });

  it("開啟 Sheet 後可按關閉還原", () => {
    render(<PlayMap />);
    const firstPlace = filterPlaygrounds({ city: listCities()[0] })[0];
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
    const firstPlace = filterPlaygrounds({ city: listCities()[0] })[0];
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

  it("涵蓋區顯示建置中文案", () => {
    render(<PlayMap />);
    expect(screen.getByText(/其他縣市建置中/)).toBeTruthy();
  });

  it("篩選導致 Sheet 關閉時不搶 focus", () => {
    render(<PlayMap />);
    const city = listCities()[0];
    const paidPlace = filterPlaygrounds({ city }).find((place) => !place.free);
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
