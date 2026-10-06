#!/usr/bin/env tsx
// 《繽紛樂園》任務冒險模擬：十站 × 兩種玩法 × 主線與變體，固定 seed。
//
//   npx tsx scripts/block-drop-sim.ts          # 每配置 200 seed
//   npx tsx scripts/block-drop-sim.ts 60       # 60 seed
//
// 門檻（計劃「可解」第 3 點）：輕鬆模式孩子式「≤2 次救援內完成」≥80%；
// 挑戰模式有點技巧勝率第 1–3 站 ≥85%、第 4–7 站 70–85%、第 8–10 站 50–70%。
// 模擬不是孩子試玩的可玩性證明。

import { BLOCK_POLICIES, simulateBlockMany } from "../lib/games/block-drop/simulate";
import { BLOCK_STAGES, BLOCK_STATIONS, type BlockRound } from "../lib/games/block-drop/stages";

const seeds = Number(process.argv[2] ?? 200);
const pct = (n: number) => `${Math.round(n * 100)}%`.padStart(4);

console.log(`seeds=${seeds}`);
console.log("stage              | 孩子式：勝 ≤2救援 塊 秒 救援 3星 | 有點技巧：勝 塊 秒 3星");
for (const mode of ["easy", "challenge"] as const) {
  BLOCK_STAGES[mode].forEach((set, i) => {
    for (const stage of [set.main, ...set.variants]) {
      const round: BlockRound = { station: BLOCK_STATIONS[i]!, mode, stage, replay: stage !== set.main };
      const kid = simulateBlockMany(round, BLOCK_POLICIES.kid, seeds);
      const skilled = simulateBlockMany(round, BLOCK_POLICIES.skilled, seeds);
      console.log(
        [
          stage.id.padEnd(18),
          "|",
          pct(kid.winRate),
          pct(kid.withinTwoRescues),
          String(kid.medianPieces).padStart(3),
          String(Math.round(kid.medianSeconds)).padStart(4),
          kid.avgRescues.toFixed(1).padStart(4),
          pct(kid.threeStarRate),
          "|",
          pct(skilled.winRate),
          String(skilled.medianPieces).padStart(3),
          String(Math.round(skilled.medianSeconds)).padStart(4),
          pct(skilled.threeStarRate),
          `cap=${stage.pieceCap} eff=${stage.efficiency}`,
        ].join(" "),
      );
    }
  });
}
