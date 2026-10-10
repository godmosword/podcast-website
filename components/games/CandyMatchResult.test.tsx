// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRound } from "@/lib/games/candy-match/stages";
import { CandyMatchResult } from "./CandyMatchResult";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);

function renderWin(flawless: boolean, efficient: boolean) {
  const round = buildRound(0, "easy", { replay: false, rng: () => 0.5 });
  return render(
    <CandyMatchResult
      round={round}
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
});
