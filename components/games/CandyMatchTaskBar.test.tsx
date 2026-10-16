// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRound } from "@/lib/games/candy-match/stages";
import { freshCandyProgress, type CandyProgress } from "@/lib/games/candy-match/tasks";
import { CandyMatchTaskBar } from "./CandyMatchTaskBar";

afterEach(cleanup);

const fixedRng = () => 0.5;
const voice = {
  voiceEnabled: true,
  voiceMuted: false,
  reducedMotion: true,
  onReplay: () => {},
  onHearGoal: () => {},
};

describe("CandyMatchTaskBar", () => {
  it("目標只看圖案和剩下的數字，任務名稱留給讀屏", () => {
    const round = buildRound(2, "easy", { replay: false, rng: fixedRng });
    render(<CandyMatchTaskBar round={round} progress={freshCandyProgress()} movesLeft={0} {...voice} />);

    const goal = screen.getByRole("button", { name: "收集小紅，還差 25 台" });
    expect(goal.textContent).toBe("25");
    expect(goal.querySelector("svg")).toBeTruthy();
    const ring = screen.getByRole("progressbar", { name: "收集小紅，還差 25 台" });
    expect(ring.getAttribute("aria-valuenow")).toBe("0");
    expect(ring.getAttribute("aria-valuemax")).toBe("25");
  });

  it("達成的目標蓋上完成印章，點卡片會再念一次", () => {
    const round = buildRound(1, "easy", { replay: false, rng: fixedRng });
    const progress: CandyProgress = { ...freshCandyProgress(), collected: [0, 0, 0, 0, 0, 23] };
    const onHearGoal = vi.fn();
    render(
      <CandyMatchTaskBar round={round} progress={progress} movesLeft={0} {...voice} onHearGoal={onHearGoal} />,
    );

    const done = screen.getByRole("button", { name: "收集救護車，完成" });
    expect(done.textContent).toContain("完成！");
    expect(screen.getByTestId("candy-goal-stamp").textContent).toBe("完成！");
    done.click();
    expect(onHearGoal).toHaveBeenCalledWith(round.stage.goals[0]);
  });

  it("髒格、禮物、特殊糖、任意圖案也是圖加倒數", () => {
    const cases = [
      [0, "收集任意圖案，還差 50 台", "50"],
      [3, "啟動特殊糖，還差 1 次", "1"],
      [4, "打掃髒髒格，還差 8 格", "8"],
      [7, "把禮物送到底，還差 2 個", "2"],
    ] as const;
    for (const [index, label, num] of cases) {
      const round = buildRound(index, "easy", { replay: false, rng: fixedRng });
      render(<CandyMatchTaskBar round={round} progress={freshCandyProgress()} movesLeft={0} {...voice} />);
      const goal = screen.getByRole("button", { name: label });
      expect(goal.textContent).toBe(num);
      expect(goal.querySelector("svg")).toBeTruthy();
      cleanup();
    }
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

  it("朗讀關閉時停用重播，不重複顯示音效開關", () => {
    const round = buildRound(0, "easy", { replay: false, rng: fixedRng });
    const onReplay = vi.fn();
    render(
      <CandyMatchTaskBar
        round={round}
        progress={freshCandyProgress()}
        movesLeft={0}
        {...voice}
        voiceMuted
        onReplay={onReplay}
      />,
    );
    screen.getByRole("button", { name: "再聽一次" }).click();
    expect(screen.getByRole("button", { name: "再聽一次" }).hasAttribute("disabled")).toBe(true);
    expect(screen.queryByRole("button", { name: /朗讀/ })).toBeNull();
    expect(onReplay).not.toHaveBeenCalled();
  });

  it("家長在設定裡關掉念出來：再聽一次與朗讀開關都收起來", () => {
    const round = buildRound(0, "easy", { replay: false, rng: fixedRng });
    render(
      <CandyMatchTaskBar round={round} progress={freshCandyProgress()} movesLeft={0} {...voice} voiceEnabled={false} />,
    );
    expect(screen.queryByRole("button", { name: "再聽一次" })).toBeNull();
    expect(screen.queryByRole("button", { name: /朗讀/ })).toBeNull();
  });
});
