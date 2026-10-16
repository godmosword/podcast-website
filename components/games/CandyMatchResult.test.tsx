// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRound } from "@/lib/games/candy-match/stages";
import { freshCandyProgress, type CandyProgress } from "@/lib/games/candy-match/tasks";
import { CandyMatchResult } from "./CandyMatchResult";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);

function doneProgress(roundGoals: number): CandyProgress {
  return { ...freshCandyProgress(4), collected: [roundGoals, 0, 0, 0] };
}

function renderWin(flawless: boolean, efficient: boolean, previousMedals = 0) {
  const round = buildRound(0, "easy", { replay: false, rng: () => 0.5 });
  return render(
    <CandyMatchResult
      round={round}
      previousMedals={previousMedals}
      progress={doneProgress(50)}
      outcome={{ kind: "win", stars: 1 + Number(flawless) + Number(efficient), flawless, efficient }}
      isLastLevel={false}
      reducedMotion
      onNext={vi.fn()}
      onReplay={vi.fn()}
      onMap={vi.fn()}
    />,
  );
}

function starStates() {
  const row = screen.getByRole("img", { name: /^拿到 \d 顆星/ });
  return Array.from(row.children).map((el) => el.getAttribute("data-met"));
}

describe("CandyMatchResult", () => {
  it("本次兩星也能補齊先前缺的效率獎章，區分本次與累積", () => {
    renderWin(false, true, 3);
    expect(screen.getByRole("img", { name: "拿到 2 顆星，共 3 顆" })).toBeTruthy();
    expect(screen.getByText("新獲得 1 枚獎章 · 累積 3/3")).toBeTruthy();
  });

  it("星星由左往右亮，不跟條件綁位置（沒用道具也不會中間空一顆）", () => {
    renderWin(false, true);

    expect(screen.getByRole("img", { name: "拿到 2 顆星，共 3 顆" })).toBeTruthy();
    expect(starStates()).toEqual(["true", "true", null]);
  });

  it("拿滿三顆只有星星，不出現條件提示", () => {
    renderWin(true, true);

    expect(starStates()).toEqual(["true", "true", "true"]);
    expect(screen.queryByRole("list", { name: "還能多拿星星" })).toBeNull();
  });

  it("沒拿滿：只列出沒達成的條件，每張小籤一個條件，讀屏念得到「多拿一顆星」", () => {
    renderWin(false, true);
    let items = within(screen.getByRole("list", { name: "還能多拿星星" })).getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0]!.textContent).toContain("不用道具");
    expect(items[0]!.textContent).toContain("多拿一顆星");
    cleanup();

    renderWin(false, false);
    items = within(screen.getByRole("list", { name: "還能多拿星星" })).getAllByRole("listitem");
    expect(items.map((li) => li.getAttribute("data-rule"))).toEqual(["flawless", "efficient"]);
    expect(items[1]!.textContent).toMatch(/\d+ 次交換內/);
  });

  it("回地圖、下一站、再挑戰同一排；回地圖是圖示鈕", () => {
    renderWin(true, true);

    const map = screen.getByRole("button", { name: "回地圖" });
    const next = screen.getByRole("button", { name: "下一站" });
    const replay = screen.getByRole("button", { name: "再挑戰" });
    expect(map.textContent).toBe("");
    expect(map.querySelector("svg")).toBeTruthy();
    expect(map.parentElement).toBe(next.parentElement);
    expect(replay.parentElement).toBe(next.parentElement);
  });

  it("步數用完：回地圖也和再來一次同一排", () => {
    const round = buildRound(0, "challenge", { replay: false, rng: () => 0.5 });
    render(
      <CandyMatchResult
        round={round}
        progress={freshCandyProgress(4)}
        outcome={{ kind: "retry" }}
        isLastLevel={false}
        reducedMotion
        onNext={vi.fn()}
        onReplay={vi.fn()}
        onMap={vi.fn()}
      />,
    );

    const map = screen.getByRole("button", { name: "回地圖" });
    expect(map.parentElement).toBe(screen.getByRole("button", { name: "再來一次" }).parentElement);
  });

  it("過關時每張目標卡蓋完成章", () => {
    renderWin(true, true);
    expect(screen.getByRole("dialog", { name: "過關！" })).toBeTruthy();
    expect(screen.getAllByTestId("candy-goal-stamp").map((el) => el.textContent)).toEqual(["完成！"]);
  });

  it("挑戰沒過：用圖案標出還差幾台，達標的不重複", () => {
    const round = buildRound(2, "challenge", { replay: false, rng: () => 0.5 });
    const progress: CandyProgress = { ...freshCandyProgress(4), collected: [36, 34, 0, 0] };
    render(
      <CandyMatchResult
        round={round}
        progress={progress}
        outcome={{ kind: "retry" }}
        isLastLevel={false}
        reducedMotion
        onNext={vi.fn()}
        onReplay={vi.fn()}
        onMap={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "再試一次！" })).toBeTruthy();
    expect(screen.getByText("再差 2 台！")).toBeTruthy();
    expect(screen.queryByText("完成！")).toBeNull();
    expect(screen.getByRole("progressbar", { name: "收集計程車，還差 2 台" }).querySelector("svg")).toBeTruthy();
  });
});
