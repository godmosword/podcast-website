// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CANDY_MATCH_LEVELS } from "@/lib/games/candy-match/levels";
import type { CandyMode } from "@/lib/games/candy-match/stages";
import { CandyMatchMap, type CandyStationPreview } from "./CandyMatchMap";

afterEach(cleanup);

const TWO_COLOR: CandyStationPreview = {
  goals: [
    { kind: "collect", piece: 0, count: 25 },
    { kind: "collect", piece: 1, count: 25 },
  ],
  summary: "收集小紅、計程車各 25 個",
  moves: 16,
  replay: false,
};

function renderMap(mode: CandyMode = "easy", onModeChange = vi.fn()) {
  return render(
    <CandyMatchMap
      levels={CANDY_MATCH_LEVELS}
      stars={[3, 2]}
      maxCleared={2}
      mode={mode}
      onModeChange={onModeChange}
      previewFor={() => TWO_COLOR}
      onStart={vi.fn()}
    />,
  );
}

describe("CandyMatchMap", () => {
  it("模式只看圖示和兩個字，完整說明留給讀屏", () => {
    const onModeChange = vi.fn();
    renderMap("easy", onModeChange);

    const easy = screen.getByRole("radio", { name: /輕鬆冒險/ });
    const hard = screen.getByRole("radio", { name: /挑戰冒險/ });
    expect(easy.textContent).toBe("輕鬆");
    expect(hard.textContent).toBe("挑戰");
    expect(easy.querySelector("svg")).toBeTruthy();
    expect(hard.querySelector("svg")).toBeTruthy();
    fireEvent.click(hard);
    expect(onModeChange).toHaveBeenCalledWith("challenge");
  });

  it("大卡用圖案加數字講任務，整句只給讀屏", () => {
    renderMap();

    const goals = screen.getByLabelText("收集小紅、計程車各 25 個");
    expect(goals.textContent).toBe("×25×25");
    expect(screen.queryByText(/收集小紅/)).toBeNull();
    // 輕鬆模式沒有步數
    expect(screen.queryByLabelText(/步內/)).toBeNull();
  });

  it("挑戰模式加上腳印步數", () => {
    renderMap("challenge");

    const goals = screen.getByLabelText("收集小紅、計程車各 25 個，16 步內");
    expect(goals.textContent).toContain("16");
  });

  it("開始鈕是大圓鈕，保留 data-next 與完整名稱", () => {
    renderMap();

    const start = screen.getByRole("button", { name: "開始：第 3 站 冰淇淋小店" });
    expect(start.getAttribute("data-next")).toBe("true");
    expect(start.textContent).toBe("");
    expect(start.querySelector("svg")).toBeTruthy();
  });

  it("拿掉「怎麼玩？」和給大人看的說明句", () => {
    renderMap();

    expect(screen.queryByRole("button", { name: "怎麼玩？" })).toBeNull();
    expect(screen.queryByText(/星星是每站累積的獎章/)).toBeNull();
  });

  it("手機上 10 站排成直向蛇形：左中右中左…一站一列", () => {
    const { getByTestId } = renderMap();

    const nodes = within(getByTestId("candy-match-map")).getAllByRole("button", {
      name: /^第 \d+ 站/,
    });
    expect(nodes).toHaveLength(10);
    const lanes = nodes.map((node) => node.style.getPropertyValue("--nc"));
    const rows = nodes.map((node) => node.style.getPropertyValue("--nr"));
    expect(lanes).toEqual(["1", "2", "3", "2", "1", "2", "3", "2", "1", "2"]);
    expect(rows).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  });

  it("寬螢幕仍是兩排蛇行：第二排從右往左", () => {
    const { getByTestId } = renderMap();

    const nodes = within(getByTestId("candy-match-map")).getAllByRole("button", {
      name: /^第 \d+ 站/,
    });
    const cols = nodes.map((node) => node.style.getPropertyValue("--wc"));
    const rows = nodes.map((node) => node.style.getPropertyValue("--wr"));
    expect(cols).toEqual(["1", "2", "3", "4", "5", "5", "4", "3", "2", "1"]);
    expect(rows).toEqual(["1", "1", "1", "1", "1", "2", "2", "2", "2", "2"]);
  });

  it("點鎖住的站，大卡換回下一站並說明要先完成哪一站", () => {
    renderMap();

    fireEvent.click(screen.getByRole("button", { name: /^第 6 站/ }));
    expect(screen.getByRole("status").textContent).toContain("先完成第 3 站");
    expect(
      screen.getByRole("button", { name: "開始：第 3 站 冰淇淋小店" }),
    ).toBeTruthy();
  });
});
