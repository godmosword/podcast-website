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

describe("CandyMatchResult", () => {
  it("三顆星各配一個圖示條件，達成與否讀屏念得到", () => {
    renderWin(false, true);

    const list = screen.getByRole("list", { name: "本局星星條件" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items.map((li) => li.getAttribute("data-met"))).toEqual(["true", null, "true"]);
    for (const li of items) expect(li.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
    expect(items[1]!.textContent).toContain("未達成");
  });

  it("拿掉重複的「這一站總共」和「這一局」小字", () => {
    renderWin(true, true);

    expect(screen.queryByText(/這一站總共/)).toBeNull();
    expect(screen.queryByText("這一局")).toBeNull();
  });

  it("回地圖是圖示鈕，下一站與再挑戰照舊", () => {
    renderWin(true, true);

    const map = screen.getByRole("button", { name: "回地圖" });
    expect(map.textContent).toBe("");
    expect(map.querySelector("svg")).toBeTruthy();
    expect(screen.getByRole("button", { name: "下一站" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "再挑戰" })).toBeTruthy();
  });
});
