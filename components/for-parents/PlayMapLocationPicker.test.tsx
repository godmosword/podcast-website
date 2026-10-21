// @vitest-environment jsdom
import React, { useRef, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listCities } from "@/data/playgrounds";
import {
  buildPlayMapRegions,
  listUncataloguedCities,
} from "@/lib/play-map-regions";
import type { GeoStatus } from "./PlayMapContract";
import { PlayMapLocationPicker } from "./PlayMapLocationPicker";

vi.stubGlobal("React", React);
// jsdom 沒實作 scrollTo；捲動鎖解除時會呼叫它。
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

type Overrides = {
  counts?: ReadonlyMap<string, number>;
  selectedCity?: string | null;
  nearMeActive?: boolean;
  geoStatus?: GeoStatus;
  scenarioLabel?: string | null;
};

const DEFAULT_COUNTS = new Map([
  ["桃園市", 10],
  ["台北市", 3],
  ["高雄市", 0],
]);

/** 觸發鈕＋面板，模擬 PlayMap 的開關與焦點返還。 */
function Harness({
  overrides,
  onSelectCity,
  onNearMe,
}: {
  overrides: Overrides;
  onSelectCity: (next: string | null) => void;
  onNearMe: () => void;
}) {
  const [open, setOpen] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <main>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        全台 ▾
      </button>
      <PlayMapLocationPicker
        open={open}
        onClose={() => setOpen(false)}
        returnFocusRef={triggerRef}
        regions={buildPlayMapRegions({ counts: overrides.counts ?? DEFAULT_COUNTS })}
        allCount={13}
        selectedCity={overrides.selectedCity ?? null}
        onSelectCity={(next) => {
          onSelectCity(next);
          setOpen(false);
        }}
        uncataloguedCities={listUncataloguedCities()}
        scenarioLabel={overrides.scenarioLabel ?? null}
        nearMeActive={overrides.nearMeActive ?? false}
        geoStatus={overrides.geoStatus ?? "idle"}
        onNearMe={onNearMe}
      />
    </main>
  );
}

function renderPicker(overrides: Overrides = {}) {
  const onSelectCity = vi.fn();
  const onNearMe = vi.fn();
  render(<Harness overrides={overrides} onSelectCity={onSelectCity} onNearMe={onNearMe} />);
  return { onSelectCity, onNearMe };
}

describe("PlayMapLocationPicker（dialog）", () => {
  it("是有名字的 modal dialog，掛在 body 底下", () => {
    renderPicker();
    const dialog = screen.getByRole("dialog", { name: "去哪裡玩？" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.closest("main")).toBeNull();
  });

  it("開著時背景設 inert、只鎖 html 的捲動；關閉後還原原本的 inline style", () => {
    document.documentElement.style.overflow = "clip";
    renderPicker();
    const main = document.querySelector("main")!;
    expect(main.closest("[inert]")).not.toBeNull();
    expect(document.documentElement.style.overflow).toBe("hidden");
    // body 不能設 overflow 或 position:fixed：兩者都會讓已黏住的位置列脫黏，≥980 面板就錨到畫面外。
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "關閉" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(main.closest("[inert]")).toBeNull();
    expect(document.documentElement.style.overflow).toBe("clip");
    document.documentElement.style.overflow = "";
  });

  it("原本就 inert 的節點不會被關閉面板解除", () => {
    const preInert = document.createElement("div");
    preInert.setAttribute("inert", "");
    document.body.appendChild(preInert);
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "關閉" }));
    expect(preInert.hasAttribute("inert")).toBe(true);
  });

  it("連續開關兩次，背景與捲動鎖每次都還原", () => {
    renderPicker();
    const main = document.querySelector("main")!;
    const trigger = screen.getByRole("button", { name: "全台 ▾" });
    fireEvent.click(screen.getByRole("button", { name: "關閉" }));
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(main.closest("[inert]")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "關閉" }));
    expect(main.closest("[inert]")).toBeNull();
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("Esc 關閉，焦點回到觸發鈕", () => {
    renderPicker();
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement?.textContent).toBe("全台 ▾");
  });

  it("開面板前焦點在別的控制項（滑鼠開啟、Safari 不給按鈕焦點）時，關閉後仍回到觸發鈕", () => {
    const elsewhere = document.createElement("button");
    elsewhere.textContent = "elsewhere";
    document.body.appendChild(elsewhere);
    elsewhere.focus();
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "關閉" }));
    expect(document.activeElement?.textContent).toBe("全台 ▾");
  });

  it("點遮罩關閉；點面板內部不關", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    const backdrop = document.querySelector("[data-play-map-location-backdrop]")!;
    fireEvent.click(backdrop);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

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

  it("命中數以可見文字呈現；副標說明數字是哪個情境", () => {
    renderPicker({ scenarioLabel: "下雨也能玩" });
    const taoyuan = screen.getByRole("button", { name: "桃園市，10 個地點" });
    expect(taoyuan.textContent).toContain("10");
    expect(screen.getByText("數字是「下雨也能玩」的地方數")).toBeTruthy();
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
  });

  it("已收錄但 0 筆的縣市仍可點選，並標成 empty", () => {
    const { onSelectCity } = renderPicker();
    const kaohsiung = screen.getByRole("button", { name: "高雄市，0 個地點" });
    expect(kaohsiung.dataset.status).toBe("empty");
    fireEvent.click(kaohsiung);
    expect(onSelectCity).toHaveBeenCalledWith("高雄市");
  });

  it("選縣市後關閉面板，焦點回到觸發鈕", () => {
    const { onSelectCity } = renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "台北市，3 個地點" }));
    expect(onSelectCity).toHaveBeenCalledWith("台北市");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement?.textContent).toBe("全台 ▾");
  });

  it("「全台」選回不限縣市，並顯示全台筆數", () => {
    const { onSelectCity } = renderPicker({ selectedCity: "桃園市" });
    const all = screen.getByRole("button", { name: "全台，13 處" });
    expect(all.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(all);
    expect(onSelectCity).toHaveBeenCalledWith(null);
  });

  it("已選定的縣市標記 aria-pressed，其餘為 false", () => {
    renderPicker({ selectedCity: "桃園市" });
    const pressed = (name: string) =>
      screen.getByRole("button", { name }).getAttribute("aria-pressed");
    expect(pressed("桃園市，10 個地點")).toBe("true");
    expect(pressed("台北市，3 個地點")).toBe("false");
  });

  it("面板裡的「我附近」不搶位置列的 nearby e2e 契約，按下會定位", () => {
    const { onNearMe } = renderPicker({ nearMeActive: true, geoStatus: "pending" });
    const nearMe = screen.getByRole("button", { name: "我附近" });
    expect(nearMe.dataset.quickFilter).toBeUndefined();
    expect(nearMe.getAttribute("aria-pressed")).toBe("true");
    expect(nearMe.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(nearMe);
    expect(onNearMe).toHaveBeenCalledTimes(1);
  });

  it("定位失敗時提示改選縣市", () => {
    renderPicker({ geoStatus: "denied" });
    expect(screen.getByRole("status").textContent).toBe(
      "無法定位。可改選縣市，或稍後再開啟定位。",
    );
  });
});
