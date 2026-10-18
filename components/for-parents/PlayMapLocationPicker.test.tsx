// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listCities } from "@/data/playgrounds";
import {
  buildPlayMapRegions,
  listUncataloguedCities,
} from "@/lib/play-map-regions";
import type { GeoStatus } from "./PlayMapContract";
import { PlayMapLocationPicker } from "./PlayMapLocationPicker";

vi.stubGlobal("React", React);

afterEach(() => cleanup());

type Overrides = {
  counts?: ReadonlyMap<string, number>;
  selectedCity?: string | null;
  nearMeActive?: boolean;
  geoStatus?: GeoStatus;
};

const DEFAULT_COUNTS = new Map([
  ["桃園市", 10],
  ["台北市", 3],
  ["高雄市", 0],
]);

function renderPicker(overrides: Overrides = {}) {
  const onToggleCity = vi.fn();
  const onNearMe = vi.fn();
  const props = {
    regions: buildPlayMapRegions({ counts: overrides.counts ?? DEFAULT_COUNTS }),
    uncataloguedCities: listUncataloguedCities(),
    onToggleCity,
    nearMeActive: overrides.nearMeActive ?? false,
    geoStatus: overrides.geoStatus ?? ("idle" as GeoStatus),
    onNearMe,
  };
  const view = render(
    <PlayMapLocationPicker {...props} selectedCity={overrides.selectedCity ?? null} />,
  );
  return { onToggleCity, onNearMe, props, rerender: view.rerender };
}

describe("PlayMapLocationPicker", () => {
  it("每個已收錄縣市各有一顆按鈕，依北中南分組", () => {
    renderPicker();
    const picker = screen.getByRole("group", { name: "依縣市瀏覽" });
    const cityButtons = within(picker)
      .getAllByRole("button")
      .filter((button) => button.dataset.city);
    expect(cityButtons).toHaveLength(listCities().length);
    for (const name of ["北部", "中部", "南部"]) {
      expect(screen.getByRole("group", { name })).toBeTruthy();
    }
  });

  it("命中數以可見文字呈現", () => {
    renderPicker();
    const taoyuan = screen.getByRole("button", { name: "桃園市，10 個地點" });
    expect(taoyuan.textContent).toContain("桃園市");
    expect(taoyuan.textContent).toContain("10");
  });

  it("未收錄縣市不做成按鈕，改在下方用可見文字說明", () => {
    renderPicker();
    for (const city of listUncataloguedCities()) {
      expect(screen.queryByRole("button", { name: new RegExp(`^${city}`) })).toBeNull();
    }
    const notice = screen.getByText(/^尚未收錄：/);
    for (const city of listUncataloguedCities()) {
      expect(notice.textContent).toContain(city);
    }
    expect(notice.textContent).toContain("不代表當地沒有好去處");
  });

  it("已收錄但 0 筆的縣市仍可點選，並標成 empty", () => {
    const { onToggleCity } = renderPicker();
    const kaohsiung = screen.getByRole("button", { name: "高雄市，0 個地點" });
    expect(kaohsiung.dataset.status).toBe("empty");
    expect((kaohsiung as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(kaohsiung);
    expect(onToggleCity).toHaveBeenCalledWith("高雄市");
  });

  it("點縣市會選定，再點一次取消", () => {
    const { onToggleCity, rerender, props } = renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "桃園市，10 個地點" }));
    expect(onToggleCity).toHaveBeenLastCalledWith("桃園市");

    rerender(<PlayMapLocationPicker {...props} selectedCity="桃園市" />);
    fireEvent.click(screen.getByRole("button", { name: "桃園市，10 個地點" }));
    expect(onToggleCity).toHaveBeenLastCalledWith(null);
  });

  it("已選定的縣市標記 aria-pressed，其餘為 false", () => {
    renderPicker({ selectedCity: "桃園市" });
    const pressed = (name: string) =>
      screen.getByRole("button", { name }).getAttribute("aria-pressed");
    expect(pressed("桃園市，10 個地點")).toBe("true");
    expect(pressed("台北市，3 個地點")).toBe("false");
  });

  it("收合鍵提供取消縣市的出口", () => {
    const { onToggleCity } = renderPicker({ selectedCity: "桃園市" });
    fireEvent.click(screen.getByRole("button", { name: "取消桃園市，改看全台" }));
    expect(onToggleCity).toHaveBeenCalledWith(null);
  });

  it("「我附近」保留 nearby 契約、按下狀態與定位中狀態", () => {
    const { onNearMe } = renderPicker({ nearMeActive: true, geoStatus: "pending" });
    const nearMe = screen.getByRole("button", { name: "我附近" });
    expect(nearMe.dataset.quickFilter).toBe("nearby");
    expect(nearMe.getAttribute("aria-pressed")).toBe("true");
    expect(nearMe.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("正在取得位置…");
    fireEvent.click(nearMe);
    expect(onNearMe).toHaveBeenCalledTimes(1);
  });

  it("定位失敗時提示改選縣市", () => {
    renderPicker({ geoStatus: "denied" });
    expect(screen.getByRole("status").textContent).toBe(
      "無法定位。可改選縣市，或稍後再開啟定位。",
    );
  });

  it("縣市由外部（地圖 cluster）改變時不搶焦點", () => {
    const { rerender, props } = renderPicker();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();

    rerender(<PlayMapLocationPicker {...props} selectedCity="台北市" />);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});
