// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPlayMapCityTiles,
  listUncataloguedCities,
} from "@/lib/play-map-city-tiles";
import { PlayMapCityWall } from "./PlayMapCityWall";

vi.stubGlobal("React", React);

afterEach(() => cleanup());

function renderWall(
  overrides: {
    counts?: ReadonlyMap<string, number>;
    selectedCity?: string | null;
  } = {},
) {
  const onToggleCity = vi.fn();
  const counts =
    overrides.counts ??
    new Map([
      ["桃園市", 10],
      ["台北市", 3],
      ["高雄市", 0],
    ]);
  render(
    <PlayMapCityWall
      tiles={buildPlayMapCityTiles({ counts })}
      selectedCity={overrides.selectedCity ?? null}
      uncataloguedCities={listUncataloguedCities()}
      onToggleCity={onToggleCity}
    />,
  );
  return { onToggleCity };
}

describe("PlayMapCityWall", () => {
  it("22 個縣市各有一塊磚", () => {
    renderWall();
    const wall = screen.getByRole("group", { name: "依縣市瀏覽" });
    expect(within(wall).getAllByRole("button")).toHaveLength(22);
  });

  it("命中數以可見文字呈現，不只靠色深編碼", () => {
    renderWall();
    const taoyuan = screen.getByRole("button", { name: "桃園市，10 個地點" });
    expect(taoyuan.textContent).toContain("桃園市");
    expect(taoyuan.textContent).toContain("10 個");
  });

  it("尚未收錄的縣市有可見文字且不可點選", () => {
    renderWall();
    const yilan = screen.getByRole("button", { name: "宜蘭縣，尚未收錄" });
    expect(yilan.textContent).toContain("未收錄");
    expect((yilan as HTMLButtonElement).disabled).toBe(true);
  });

  it("已收錄但 0 筆的縣市仍可點選，與未收錄明確區分", () => {
    renderWall();
    const kaohsiung = screen.getByRole("button", { name: "高雄市，0 個地點" });
    expect(kaohsiung.textContent).toContain("0 個");
    expect((kaohsiung as HTMLButtonElement).disabled).toBe(false);
    expect(kaohsiung.dataset.status).toBe("empty");
    expect(
      screen.getByRole("button", { name: "宜蘭縣，尚未收錄" }).dataset.status,
    ).toBe("uncatalogued");
  });

  it("點磚會選定縣市", () => {
    const { onToggleCity } = renderWall();
    fireEvent.click(screen.getByRole("button", { name: "桃園市，10 個地點" }));
    expect(onToggleCity).toHaveBeenCalledWith("桃園市");
  });

  it("點已選定的磚會取消，回到全台", () => {
    const { onToggleCity } = renderWall({ selectedCity: "桃園市" });
    fireEvent.click(screen.getByRole("button", { name: "桃園市，10 個地點" }));
    expect(onToggleCity).toHaveBeenCalledWith(null);
  });

  it("已選定的磚標記 aria-pressed，其餘為 false", () => {
    renderWall({ selectedCity: "桃園市" });
    expect(
      screen
        .getByRole("button", { name: "桃園市，10 個地點" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "台北市，3 個地點" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("磚牆下方有可見的示意排列聲明，不藏在 aria-label", () => {
    renderWall();
    expect(screen.getByText(/示意排列，非實際地理位置/)).toBeTruthy();
  });

  it("誠實聲明列出全部未收錄縣市，並說明沒收錄不等於當地沒地方玩", () => {
    renderWall();
    const legend = screen.getByText(/示意排列，非實際地理位置/);
    for (const city of listUncataloguedCities()) {
      expect(legend.textContent).toContain(city);
    }
    expect(legend.textContent).toContain("不代表當地沒有好去處");
  });

  it("收合列提供取消縣市的出口", () => {
    const { onToggleCity } = renderWall({ selectedCity: "桃園市" });
    fireEvent.click(
      screen.getByRole("button", { name: "取消桃園市，改看全台" }),
    );
    expect(onToggleCity).toHaveBeenCalledWith(null);
  });
});
