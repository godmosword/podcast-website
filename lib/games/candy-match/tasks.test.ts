import { describe, expect, it } from "vitest";
import { emptyEvents } from "./engine";
import {
  allGoalsDone,
  applyEvents,
  countSwap,
  freshCandyProgress,
  goalCompletion,
  challengeMissSpeech,
  goalDoneSpeech,
  goalHearLine,
  goalIntroLine,
  goalLine,
  goalShortfallLabel,
  goalShortfallSpeech,
  goalStatus,
  goalsSummary,
  goalTheme,
  levelGoalSpeech,
  type CandyGoal,
} from "./tasks";

const events = (patch: Partial<ReturnType<typeof emptyEvents>>) => ({ ...emptyEvents(5), ...patch });

describe("Candy 任務判定", () => {
  it("複合任務必須全部完成；進度不可變更新", () => {
    const goals: CandyGoal[] = [
      { kind: "collect", piece: 0, count: 6 },
      { kind: "detonate", count: 1 },
    ];
    const start = freshCandyProgress();
    const mid = applyEvents(start, events({ collected: [6, 0, 0, 0, 0] }));
    expect(start.collected[0]).toBe(0);
    expect(goalStatus(goals[0]!, mid).done).toBe(true);
    expect(allGoalsDone(goals, mid)).toBe(false);
    const done = applyEvents(mid, events({ detonated: 1 }));
    expect(allGoalsDone(goals, done)).toBe(true);
  });

  it("收集任意圖案、清潔、禮物各自計數；剩餘量不為負", () => {
    const p = applyEvents(freshCandyProgress(), events({ collected: [3, 4, 0, 2, 0], cleaned: 2, dropped: 1 }));
    expect(goalStatus({ kind: "collect-any", count: 5 }, p)).toEqual({ got: 5, need: 5, remaining: 0, done: true });
    expect(goalStatus({ kind: "clean-dirt", count: 8 }, p).remaining).toBe(6);
    expect(goalStatus({ kind: "drop-item", count: 2 }, p).remaining).toBe(1);
  });

  it("有效交換另計，不受事件影響", () => {
    const p = countSwap(countSwap(freshCandyProgress()));
    expect(p.swaps).toBe(2);
    expect(applyEvents(p, events({ waves: 3 })).swaps).toBe(2);
  });

  it("完成度與任務文案", () => {
    const goals: CandyGoal[] = [
      { kind: "collect", piece: 0, count: 15 },
      { kind: "collect", piece: 1, count: 15 },
    ];
    const p = applyEvents(freshCandyProgress(), events({ collected: [3, 15, 0, 0, 0] }));
    expect(goalCompletion(goals, p)).toBeCloseTo(18 / 30);
    expect(goalLine(goals[0]!, p)).toBe("收集小紅，還差 12 台");
    expect(goalLine(goals[1]!, p)).toBe("收集計程車，完成");
    expect(goalLine({ kind: "clean-dirt", count: 8 }, p)).toBe("打掃髒髒格，還差 8 格");
    expect(goalLine({ kind: "detonate", count: 2 }, p)).toBe("啟動特殊糖，還差 2 次");
  });

  it("地圖摘要與背景主題", () => {
    expect(goalsSummary([{ kind: "collect", piece: 0, count: 12 }, { kind: "collect", piece: 1, count: 12 }])).toBe(
      "收集小紅、計程車各 12 個",
    );
    expect(goalsSummary([{ kind: "collect", piece: 2, count: 18 }, { kind: "detonate", count: 1 }])).toBe(
      "收集小巴士 18 個＋啟動特殊糖 1 次",
    );
    expect(goalsSummary([{ kind: "drop-item", count: 2 }])).toBe("送達 2 個禮物");
    expect(goalTheme([{ kind: "drop-item", count: 2 }, { kind: "collect", piece: 0, count: 3 }])).toBe("drop-item");
    expect(goalTheme([{ kind: "collect", piece: 0, count: 3 }, { kind: "collect", piece: 1, count: 3 }])).toBe(
      "collect-multi",
    );
  });

  it("開局朗讀把目標念成一句，厚污漬再補一句", () => {
    expect(levelGoalSpeech([{ kind: "collect", piece: 1, count: 30 }, { kind: "detonate", count: 2 }])).toBe(
      "收集 30 台計程車，還要啟動特殊糖 2 次。",
    );
    expect(levelGoalSpeech([{ kind: "clean-dirt", count: 8 }], true)).toBe(
      "打掃 8 格髒髒。有的污漬比較厚，要再掃一次！",
    );
  });

  it("關前句子、完成與差額涵蓋五種目標", () => {
    const goals: CandyGoal[] = [
      { kind: "collect-any", count: 5 },
      { kind: "collect", piece: 0, count: 5 },
      { kind: "detonate", count: 1 },
      { kind: "clean-dirt", count: 8 },
      { kind: "drop-item", count: 2 },
    ];
    expect(goals.map(goalIntroLine)).toEqual([
      "收集 5 台車車",
      "收集 5 台小紅",
      "啟動特殊糖 1 次",
      "打掃 8 格髒髒",
      "送 2 個禮物",
    ]);
    expect(goals.map(goalDoneSpeech)).toEqual([
      "車車收集完成了！",
      "小紅完成了！",
      "特殊糖完成了！",
      "打掃完成了！",
      "禮物送到了！",
    ]);
    const progress = applyEvents(freshCandyProgress(), events({ collected: [3, 0, 0, 0, 0], cleaned: 6, dropped: 2 }));
    expect(goalShortfallLabel(goals[1]!, 2)).toBe("再差 2 台！");
    expect(goalShortfallSpeech(goals[1]!, 2)).toBe("再差 2 台小紅！");
    expect(goalShortfallLabel(goals[3]!, 2)).toBe("再差 2 格！");
    expect(goalShortfallSpeech(goals[2]!, 1)).toBe("再差 1 次特殊糖！");
    expect(goalHearLine(goals[1]!, progress)).toBe("還差 2 台小紅！");
    expect(goalHearLine(goals[4]!, progress)).toBe("禮物送到了！");
    expect(challengeMissSpeech(goals, progress)).toBe("再差 2 台車車！再差 2 台小紅！再差 1 次特殊糖！再差 2 格髒髒！");
  });
});
