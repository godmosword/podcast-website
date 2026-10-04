#!/usr/bin/env tsx
// 《繽紛消消樂》難度模擬：每關 × 玩法 × 配置跑固定 seed，比較目標導向與隨機策略。
//
//   npx tsx scripts/candy-match-sim.ts            # 預設每配置 200 seed
//   npx tsx scripts/candy-match-sim.ts 50 easy    # 50 seed、只跑輕鬆
//
// 模擬不用道具；結果是調校依據，不等於孩子試玩的可玩性證明。

import { CANDY_MATCH_LEVELS } from "../lib/games/candy-match/levels";
import { simulateMany } from "../lib/games/candy-match/simulate";
import {
  CANDY_STAGES,
  candyProps,
  type CandyMatchRound,
  type CandyMode,
} from "../lib/games/candy-match/stages";

const seeds = Number(process.argv[2] ?? 200);
const onlyMode = process.argv[3] as CandyMode | undefined;
const pct = (n: number) => `${Math.round(n * 100)}%`.padStart(4);

console.log(`seeds=${seeds}`);
console.log("mode      lv stage                      greedy  med p90 quick | random  med | sp-made deto resh | eff");
for (const mode of ["easy", "challenge"] as const) {
  if (onlyMode && onlyMode !== mode) continue;
  CANDY_STAGES[mode].forEach((set, levelIndex) => {
    const level = CANDY_MATCH_LEVELS[levelIndex]!;
    for (const stage of [set.main, ...set.variants]) {
      const round: CandyMatchRound = { ...level, mode, stage, props: candyProps(mode, levelIndex), replay: stage !== set.main };
      const greedy = simulateMany(round, "greedy", seeds);
      const random = simulateMany(round, "random", seeds);
      console.log(
        [
          mode.padEnd(9),
          String(levelIndex + 1).padStart(2),
          stage.id.padEnd(26),
          pct(greedy.winRate),
          String(greedy.medianSwaps).padStart(4),
          String(greedy.p90Swaps).padStart(3),
          pct(greedy.quickWinRate),
          "|",
          pct(random.winRate),
          String(random.medianSwaps).padStart(4),
          "|",
          greedy.avgSpecialsMade.toFixed(1).padStart(7),
          greedy.avgDetonated.toFixed(1).padStart(4),
          greedy.avgReshuffles.toFixed(1).padStart(4),
          "|",
          String(stage.efficiency).padStart(3),
        ].join(" "),
      );
    }
  });
}
