import { describe, expect, it } from "vitest";
import { CANDY_MATCH_LEVELS } from "./levels";
import { freshCandyProgress } from "./tasks";
import {
  CANDY_STAGES,
  buildRound,
  candyProps,
  efficiencyMet,
  isStageFeasible,
  selectVariant,
} from "./stages";

describe("Candy 關卡尺寸", () => {
  it("10 關、六欄；1–2 關 6×6、3–5 關 6×7、6–10 關 6×8", () => {
    expect(CANDY_MATCH_LEVELS).toHaveLength(10);
    CANDY_MATCH_LEVELS.forEach((level, i) => {
      expect(level.index).toBe(i);
      expect(level.cols).toBe(6);
      expect(level.rows).toBe(i < 2 ? 6 : i < 5 ? 7 : 8);
    });
  });
});

describe("Candy 十關 × 兩種玩法配置", () => {
  it("每關兩種玩法都有主線與至少兩個重玩變體，全部可完成且 id 唯一", () => {
    const ids = new Set<string>();
    for (const mode of ["easy", "challenge"] as const) {
      expect(CANDY_STAGES[mode]).toHaveLength(10);
      CANDY_STAGES[mode].forEach((set, li) => {
        const level = CANDY_MATCH_LEVELS[li]!;
        expect(set.variants.length).toBeGreaterThanOrEqual(2);
        for (const stage of [set.main, ...set.variants]) {
          expect(isStageFeasible(level, stage), `${mode}/${stage.id}`).toBe(true);
          expect(ids.has(stage.id)).toBe(false);
          ids.add(stage.id);
          expect(stage.efficiency).toBeGreaterThan(0);
          if (mode === "easy") expect(stage.moves).toBe(0);
          if (mode === "challenge") expect(stage.moves).toBeGreaterThan(stage.efficiency);
        }
      });
    }
  });

  it("挑戰模式步數隨關卡不減少；後期挑戰用 5 種圖案", () => {
    const moves = CANDY_STAGES.challenge.map((set) => set.main.moves);
    moves.slice(1).forEach((m, i) => expect(m).toBeGreaterThanOrEqual(moves[i]!));
    CANDY_STAGES.challenge.slice(5).forEach((set) => expect(set.main.pieceKinds).toBe(5));
    CANDY_STAGES.easy.forEach((set) => expect(set.main.pieceKinds).toBe(4));
  });

  it("特殊糖任務開局保證有做出特殊糖的路徑", () => {
    for (const mode of ["easy", "challenge"] as const) {
      for (const set of CANDY_STAGES[mode]) {
        for (const stage of [set.main, ...set.variants]) {
          if (stage.goals.some((goal) => goal.kind === "detonate") && !stage.dropCount) {
            expect(stage.requireSpecialMove, stage.id).toBe(true);
          }
        }
      }
    }
  });
});

describe("buildRound", () => {
  it("第一次進關用主線；重玩抽變體且避開上一次", () => {
    const first = buildRound(2, "easy", { replay: false, rng: () => 0.99 });
    expect(first.stage.id).toBe(CANDY_STAGES.easy[2]!.main.id);
    expect(first.replay).toBe(false);
    const replay = buildRound(2, "easy", { replay: true, rng: () => 0 });
    expect(CANDY_STAGES.easy[2]!.variants.map((s) => s.id)).toContain(replay.stage.id);
    const again = selectVariant("easy", 2, replay.stage.id, () => 0);
    expect(again.id).not.toBe(replay.stage.id);
  });

  it("組出的局帶地圖站資料，不污染配置", () => {
    const round = buildRound(7, "challenge", { replay: false, rng: Math.random });
    expect(round.place).toBe("星星舞台");
    expect(round.rows).toBe(8);
    expect(round.mode).toBe("challenge");
    expect(CANDY_STAGES.challenge[7]!.main).toBe(round.stage);
  });
});

describe("道具與效率星", () => {
  it("輕鬆第 1 關沒有彩虹、第 2 關起 1 次；挑戰泡泡 1 次、第 4 關起才有彩虹", () => {
    expect(candyProps("easy", 0)).toEqual({ bubble: 2, broom: 1, rainbow: 0 });
    expect(candyProps("easy", 1)).toEqual({ bubble: 2, broom: 1, rainbow: 1 });
    expect(candyProps("challenge", 2)).toEqual({ bubble: 1, broom: 1, rainbow: 0 });
    expect(candyProps("challenge", 3)).toEqual({ bubble: 1, broom: 1, rainbow: 1 });
  });

  it("輕鬆看有效交換數、挑戰看剩餘步數", () => {
    const easy = buildRound(0, "easy", { replay: false, rng: Math.random });
    const p = { ...freshCandyProgress(), swaps: easy.stage.efficiency };
    expect(efficiencyMet(easy, p, 0)).toBe(true);
    expect(efficiencyMet(easy, { ...p, swaps: p.swaps + 1 }, 0)).toBe(false);
    const ch = buildRound(0, "challenge", { replay: false, rng: Math.random });
    expect(efficiencyMet(ch, p, ch.stage.efficiency)).toBe(true);
    expect(efficiencyMet(ch, p, ch.stage.efficiency - 1)).toBe(false);
  });
});
