// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRound } from "@/lib/games/candy-match/stages";
import { CandyMatchGoalIntro } from "./CandyMatchGoalIntro";

afterEach(cleanup);

const fixedRng = () => 0.5;

function renderIntro(index: number, mode: "easy" | "challenge" = "easy", thick = false) {
  const onStart = vi.fn();
  const round = buildRound(index, mode, { replay: false, rng: fixedRng });
  render(<CandyMatchGoalIntro round={round} thick={thick} reducedMotion onStart={onStart} />);
  return { onStart, round };
}

describe("CandyMatchGoalIntro", () => {
  it("大圖和數量寫出收集幾台，點開始或點畫面都會收起", () => {
    const { onStart } = renderIntro(1);
    expect(screen.getByText("收集 23 台救護車")).toBeTruthy();
    expect(screen.getByText("23")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "本關任務" }).querySelector("svg")).toBeTruthy();
    screen.getByRole("button", { name: "開始！" }).click();
    expect(onStart).toHaveBeenCalledTimes(1);
    screen.getByText("收集 23 台救護車").click();
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it("任意圖案、特殊糖、髒格、禮物都用圖和一句話", () => {
    renderIntro(0);
    expect(screen.getByText("收集 50 台車車")).toBeTruthy();
    cleanup();

    renderIntro(3);
    expect(screen.getByText("收集 33 台小巴士")).toBeTruthy();
    expect(screen.getByText("啟動特殊糖 1 次")).toBeTruthy();
    cleanup();

    renderIntro(4);
    expect(screen.getByText("打掃 8 格髒髒")).toBeTruthy();
    cleanup();

    const { onStart } = renderIntro(7, "easy", true);
    expect(screen.getByText("送 2 個禮物")).toBeTruthy();
    expect(screen.getByText("有的污漬比較厚，要再掃一次！")).toBeTruthy();
    expect(onStart).not.toHaveBeenCalled();
  });

  it("開始鈕至少 56px", () => {
    const css = readFileSync("components/games/CandyMatchPlay.module.css", "utf8");
    expect(css).toMatch(/\.introStart\s*\{[^}]*min-height:\s*56px/);
    expect(css).toMatch(/\.goalCardButton\s*\{[^}]*min-height:\s*84px/);
    expect(css).toMatch(/\.muteButton\s*\{[^}]*width:\s*56px/);
  });
});
