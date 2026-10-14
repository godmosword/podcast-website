// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRound } from "@/lib/games/candy-match/stages";
import { freshCandyProgress } from "@/lib/games/candy-match/tasks";
import { CandyMatchTaskBar } from "./CandyMatchTaskBar";

afterEach(cleanup);

const fixedRng = () => 0.5;
const voice = { voiceMuted: false, onReplay: () => {}, onToggleVoice: () => {} };

describe("CandyMatchTaskBar", () => {
  it("目標只看圖案和剩下的數字，任務名稱留給讀屏", () => {
    const round = buildRound(2, "easy", { replay: false, rng: fixedRng });
    render(<CandyMatchTaskBar round={round} progress={freshCandyProgress()} movesLeft={0} {...voice} />);

    const goal = screen.getByLabelText("收集小紅，還差 25 個");
    expect(goal.textContent).toBe("25");
    expect(goal.querySelector("svg")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "任務完成度" })).toBeTruthy();
  });

  it("局內不再倒數第三顆星（「再 N 次」只在結算說）", () => {
    const round = buildRound(0, "easy", { replay: false, rng: fixedRng });
    render(<CandyMatchTaskBar round={round} progress={freshCandyProgress()} movesLeft={0} {...voice} />);

    expect(screen.queryByText(/再 \d+ 次/)).toBeNull();
    expect(screen.queryByLabelText(/第三顆星/)).toBeNull();
  });

  it("挑戰模式的步數是腳印加數字", () => {
    const round = buildRound(2, "challenge", { replay: false, rng: fixedRng });
    render(<CandyMatchTaskBar round={round} progress={freshCandyProgress()} movesLeft={12} {...voice} />);

    const moves = screen.getByLabelText("還有 12 步");
    expect(moves.textContent).toBe("12");
    expect(moves.querySelector("svg")).toBeTruthy();
  });

  it("站名旁放這一站的圖", () => {
    const round = buildRound(2, "easy", { replay: false, rng: fixedRng });
    const { container } = render(
      <CandyMatchTaskBar round={round} progress={freshCandyProgress()} movesLeft={0} {...voice} />,
    );

    expect(container.querySelector('img[src*="ice-cream-shop"]')).toBeTruthy();
  });

  it("再聽一次與朗讀開關都在，關著時換圖示與名稱", () => {
    const round = buildRound(0, "easy", { replay: false, rng: fixedRng });
    const onReplay = vi.fn();
    const onToggleVoice = vi.fn();
    render(
      <CandyMatchTaskBar
        round={round}
        progress={freshCandyProgress()}
        movesLeft={0}
        voiceMuted
        onReplay={onReplay}
        onToggleVoice={onToggleVoice}
      />,
    );
    screen.getByRole("button", { name: "再聽一次" }).click();
    screen.getByRole("button", { name: "打開朗讀" }).click();
    expect(onReplay).toHaveBeenCalledTimes(1);
    expect(onToggleVoice).toHaveBeenCalledTimes(1);
  });
});
