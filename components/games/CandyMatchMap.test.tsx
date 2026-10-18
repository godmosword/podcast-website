// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
  efficiency: 4,
  replay: false,
};

function renderMap(
  mode: CandyMode = "easy",
  onModeChange = vi.fn(),
  challengeUnlocked = false,
  onChallengeUnlockedChange = vi.fn(),
) {
  return render(
    <CandyMatchMap
      levels={CANDY_MATCH_LEVELS}
      stars={[3, 2]}
      maxCleared={2}
      mode={mode}
      onModeChange={onModeChange}
      challengeUnlocked={challengeUnlocked}
      onChallengeUnlockedChange={onChallengeUnlockedChange}
      previewFor={() => TWO_COLOR}
      onStart={vi.fn()}
    />,
  );
}

describe("CandyMatchMap", () => {
  it("選關即可查看當次三星條件，並說明提示與累積方式", () => {
    renderMap("challenge");
    expect(screen.getByText("★ 怎麼拿三星？")).toBeTruthy();
    expect(screen.getByText("過關時剩 4 步以上")).toBeTruthy();
    expect(screen.getByText(/提示不影響星星/)).toBeTruthy();
    cleanup();
    renderMap("easy");
    expect(screen.getByText("4 次有效交換內過關")).toBeTruthy();
  });

  it("模式只看圖示和兩個字，完整說明留給讀屏", () => {
    const onModeChange = vi.fn();
    renderMap("easy", onModeChange, true);

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

  it("沒打開時地圖上沒有挑戰，短按齒輪不會開，按住或 Enter 才開", () => {
    vi.useFakeTimers();
    try {
      const onChallengeUnlockedChange = vi.fn();
      renderMap("challenge", vi.fn(), false, onChallengeUnlockedChange);

      expect(screen.queryByRole("radio")).toBeNull();
      expect(screen.queryByText("挑戰")).toBeNull();
      const gate = screen.getByRole("button", { name: "家長工具" });
      expect(gate.getAttribute("aria-describedby")).toBeTruthy();

      fireEvent.pointerDown(gate);
      act(() => {
        vi.advanceTimersByTime(699);
      });
      fireEvent.pointerUp(gate);
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByRole("dialog")).toBeNull();

      fireEvent.pointerDown(gate);
      act(() => {
        vi.advanceTimersByTime(700);
      });
      const dialog = screen.getByRole("dialog", { name: "家長工具" });
      expect(dialog).toBeTruthy();
      expect(within(dialog).getByText("星星分開記。關掉之後，挑戰的星星還在。")).toBeTruthy();
      fireEvent.click(within(dialog).getByRole("button", { name: "挑戰" }));
      expect(onChallengeUnlockedChange).toHaveBeenCalledWith(true);

      fireEvent.click(screen.getByRole("button", { name: "關閉" }));
      expect(screen.queryByRole("dialog")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("打開之後可以切回輕鬆，家長再關掉時不改已選的玩法", () => {
    const onModeChange = vi.fn();
    const onChallengeUnlockedChange = vi.fn();
    renderMap("challenge", onModeChange, true, onChallengeUnlockedChange);

    const easy = screen.getByRole("radio", { name: /輕鬆冒險/ });
    expect(screen.getByRole("radio", { name: /挑戰冒險/ }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(easy);
    expect(onModeChange).toHaveBeenCalledWith("easy");

    fireEvent.keyDown(screen.getByRole("button", { name: "家長工具" }), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "挑戰" }));
    expect(onChallengeUnlockedChange).toHaveBeenCalledWith(false);
    expect(onModeChange).not.toHaveBeenCalledWith("challenge");
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
