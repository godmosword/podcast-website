import { describe, expect, it } from "vitest";
import { CANDY_MATCH_LEVELS, CANDY_PIECE } from "./levels";
import { freshCandyProgress } from "./tasks";
import {
  CANDY_STAGES,
  buildRound,
  candyProps,
  efficiencyMet,
  isStageFeasible,
  selectVariant,
  stagePalette,
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

  it("挑戰前五關放寬到普通三連清得掉，輕鬆第 1 關不動", () => {
    const easy = CANDY_STAGES.easy[0]!.main;
    expect(easy.moves).toBe(0);
    expect(easy.goals).toContainEqual({ kind: "collect-any", count: 50 });
    const first = CANDY_STAGES.challenge[0]!.main;
    const any = first.goals.find((goal) => goal.kind === "collect-any");
    expect(any && any.count / first.moves).toBeLessThanOrEqual(2.5);
    const second = CANDY_STAGES.challenge[1]!.main.goals[0]!;
    expect(second.kind).toBe("collect");
    expect(second.count / CANDY_STAGES.challenge[1]!.main.moves).toBeLessThanOrEqual(1);
    const third = CANDY_STAGES.challenge[2]!.main;
    const two = third.goals.filter((goal) => goal.kind === "collect").reduce((sum, goal) => sum + goal.count, 0);
    expect(two / third.moves).toBeLessThanOrEqual(2);
  });

  it("挑戰模式步數隨關卡不減少；後期挑戰用 5 種圖案", () => {
    const moves = CANDY_STAGES.challenge.map((set) => set.main.moves);
    moves.slice(1).forEach((m, i) => expect(m).toBeGreaterThanOrEqual(moves[i]!));
    CANDY_STAGES.challenge.slice(5).forEach((set) => expect(set.main.pieceKinds).toBe(5));
    CANDY_STAGES.easy.forEach((set) => expect(set.main.pieceKinds).toBe(4));
  });

  it("新車輪替進十關，同場種類不變，消防車不與小紅同場", () => {
    const seen = { easy: new Set<number>(), challenge: new Set<number>() };
    const easyLevelsWithNew = CANDY_STAGES.easy.map((set) =>
      stagePalette(set.main).some((id) => id >= CANDY_PIECE.ambulance),
    );
    for (const mode of ["easy", "challenge"] as const) {
      CANDY_STAGES[mode].forEach((set, li) => {
        for (const stage of [set.main, ...set.variants]) {
          const palette = stagePalette(stage);
          expect(palette, stage.id).toHaveLength(stage.pieceKinds);
          expect(palette.includes(CANDY_PIECE.red) && palette.includes(CANDY_PIECE.fire), stage.id).toBe(false);
          for (const id of palette) seen[mode].add(id);
          for (const goal of stage.goals) {
            if (goal.kind === "collect") expect(palette, stage.id).toContain(goal.piece);
          }
        }
        if (mode === "challenge" && li >= 5) expect(set.main.pieceKinds).toBe(5);
      });
    }
    for (const id of [CANDY_PIECE.ambulance, CANDY_PIECE.fire, CANDY_PIECE.train]) {
      expect(seen.easy.has(id)).toBe(true);
      expect(seen.challenge.has(id)).toBe(true);
    }
    for (const id of [CANDY_PIECE.red, CANDY_PIECE.taxi, CANDY_PIECE.bus, CANDY_PIECE.bell, CANDY_PIECE.duo]) {
      expect(seen.challenge.has(id)).toBe(true);
    }
    expect(easyLevelsWithNew[0]).toBe(false);
    expect(easyLevelsWithNew.filter(Boolean).length).toBeGreaterThanOrEqual(8);
    expect(easyLevelsWithNew[9]).toBe(true);
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

describe("輕鬆後期時長", () => {
  function perColor(index: number): number {
    const goals = CANDY_STAGES.easy[index]!.main.goals.filter((goal) => goal.kind === "collect");
    expect(goals.length).toBeGreaterThan(0);
    const count = goals[0]!.count;
    expect(goals.every((goal) => goal.count === count)).toBe(true);
    return count;
  }

  it("第 7、9、10 關每色落在 25–35，後面不會比前面少，特殊糖還在", () => {
    const level7 = perColor(6);
    const level9 = perColor(8);
    const level10 = perColor(9);
    for (const count of [level7, level9, level10]) {
      expect(count).toBeGreaterThanOrEqual(25);
      expect(count).toBeLessThanOrEqual(35);
    }
    expect(level9).toBeGreaterThanOrEqual(level7);
    expect(level10).toBeGreaterThanOrEqual(level9);
    expect(level7).toBe(30);
    expect(level9).toBe(33);
    expect(level10).toBe(35);
    expect(CANDY_STAGES.easy[6]!.main.goals).toContainEqual({ kind: "detonate", count: 2 });
    expect(CANDY_STAGES.easy[9]!.main.goals).toContainEqual({ kind: "detonate", count: 3 });
    expect(CANDY_STAGES.easy[7]!.main.goals).toEqual([{ kind: "drop-item", count: 2 }]);
  });

  it("挑戰模式後期收集數維持原樣", () => {
    expect(CANDY_STAGES.challenge[6]!.main.id).toBe("c7-taxi-40-sp3");
    expect(CANDY_STAGES.challenge[7]!.main.id).toBe("c8-gift-3-fire-30");
    expect(CANDY_STAGES.challenge[8]!.main.id).toBe("c9-red-bus-train-38");
    expect(CANDY_STAGES.challenge[9]!.main.id).toBe("c10-fire-taxi-bus-40-sp4");
    expect(CANDY_STAGES.challenge[6]!.main.goals).toContainEqual({ kind: "collect", piece: 1, count: 40 });
    expect(CANDY_STAGES.challenge[8]!.main.goals).toContainEqual({ kind: "collect", piece: 0, count: 38 });
    expect(CANDY_STAGES.challenge[9]!.main.goals).toContainEqual({ kind: "detonate", count: 4 });
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
