import { describe, expect, it } from "vitest";
import { CANDY_POP_MS, emptySpecials, type CandySpecial } from "./engine";
import {
  BURST_FX_MS,
  COLOR_FX_MS,
  CONFETTI_COUNT,
  HORN_NOTES,
  LINE_FX_MS,
  MATCH_FX_MS,
  PARTICLE_CAP,
  PARTICLES_PER_CELL,
  PRAISE_LINES,
  SHAKE_MS,
  SHAKE_PX,
  confettiPieces,
  fxHoldMs,
  matchParticles,
  particleBudget,
  planClearFx,
  praiseLine,
  presentWave,
} from "./effects";

function none(n: number): CandySpecial[] {
  return emptySpecials(n);
}

describe("連鎖稱讚", () => {
  it("一步比一步升級，第四步起停在太厲害了", () => {
    expect(praiseLine(0)).toBeNull();
    expect(praiseLine(1)).toBe("好棒");
    expect(praiseLine(2)).toBe("超級棒");
    expect(praiseLine(3)).toBe("太厲害了");
    expect(praiseLine(6)).toBe("太厲害了");
    expect(PRAISE_LINES).toEqual(["好棒", "超級棒", "太厲害了"]);
  });

  it("普通第一波不稱讚；第二波起升級；特殊組合從第一波就開始", () => {
    const base = {
      reduced: false,
      soundOn: true,
      fx: [],
      pieces: [0, 0, 0],
      cleared: [0, 1, 2],
    };
    const first = presentWave({ ...base, waveIndex: 1, previousPraiseStep: 0, combo: null });
    expect(first.praise).toBeNull();
    expect(first.horn).toBe(false);
    expect(first.confetti).toBe(false);
    expect(first.shake).toBe(false);
    expect(first.holdMs).toBe(MATCH_FX_MS);

    const reducedPlain = presentWave({ ...base, waveIndex: 1, previousPraiseStep: 0, combo: null, reduced: true });
    expect(reducedPlain.particles).toEqual([]);
    expect(reducedPlain.still).toBe(false);
    expect(reducedPlain.holdMs).toBe(MATCH_FX_MS);

    const second = presentWave({
      ...base,
      waveIndex: 2,
      previousPraiseStep: first.praiseStep,
      combo: null,
    });
    expect(second.praise).toBe("好棒");
    expect(second.horn).toBe(true);
    expect(second.confetti).toBe(true);
    expect(second.shake).toBe(false);

    const third = presentWave({
      ...base,
      waveIndex: 3,
      previousPraiseStep: second.praiseStep,
      combo: null,
    });
    expect(third.praise).toBe("超級棒");

    const fourth = presentWave({
      ...base,
      waveIndex: 4,
      previousPraiseStep: third.praiseStep,
      combo: null,
    });
    expect(fourth.praise).toBe("太厲害了");
    expect(fourth.shake).toBe(true);

    const combo = presentWave({ ...base, waveIndex: 1, previousPraiseStep: 0, combo: "color-brooms" });
    expect(combo.praise).toBe("好棒");
    expect(combo.shake).toBe(false);
  });

  it("喇叭與輕晃預設開，但跟著音效開關；減少動態不晃、不撒彩紙、不生粒子", () => {
    const praised = presentWave({
      waveIndex: 2,
      previousPraiseStep: 0,
      combo: null,
      reduced: false,
      soundOn: false,
      fx: [],
      pieces: [0, 0, 0],
      cleared: [0, 1, 2],
    });
    expect(praised.praise).toBe("好棒");
    expect(praised.horn).toBe(false);
    expect(praised.shake).toBe(false);
    expect(praised.confetti).toBe(true);
    expect(praised.particles).toHaveLength(3);

    const bigMuted = presentWave({
      waveIndex: 1,
      previousPraiseStep: 0,
      combo: "cross",
      reduced: false,
      soundOn: false,
      fx: [{ kind: "line", axis: "row", index: 0 }],
      pieces: [0, 0, 0, 0],
      cleared: [0, 1, 2, 3],
    });
    expect(bigMuted.shake).toBe(false);
    expect(bigMuted.horn).toBe(false);

    const reduced = presentWave({
      waveIndex: 4,
      previousPraiseStep: 2,
      combo: "clear-board",
      reduced: true,
      soundOn: true,
      fx: [{ kind: "color", origin: 0, cells: [0, 1] }],
      pieces: [0, 0],
      cleared: [0, 1],
    });
    expect(reduced.shake).toBe(false);
    expect(reduced.confetti).toBe(false);
    expect(reduced.particles).toEqual([]);
    expect(reduced.still).toBe(true);
    expect(reduced.horn).toBe(true);
    expect(reduced.holdMs).toBeLessThan(SHAKE_MS);
  });
});

describe("消除特效種類", () => {
  it("掃把沿橫排開車，普通三連沒有車", () => {
    const pieces = [0, 0, 0, 1, 1, 2, 1, 2, 1, 2, 1, 2];
    const specials = none(12);
    specials[1] = "row";
    expect(
      planClearFx({ pieces, specials, cols: 4, rows: 3, cleared: [0, 1, 2, 3] }),
    ).toEqual([{ kind: "line", axis: "row", index: 0, piece: 0 }]);

    const plain = none(9);
    expect(
      planClearFx({
        pieces: [0, 0, 0, 1, 2, 1, 2, 1, 2],
        specials: plain,
        cols: 3,
        rows: 3,
        cleared: [0, 1, 2],
      }),
    ).toEqual([]);

    const ambulance = none(12);
    ambulance[0] = "row";
    expect(
      planClearFx({
        pieces: [5, 5, 5, 5, 1, 2, 1, 2, 1, 2, 1, 2],
        specials: ambulance,
        cols: 4,
        rows: 3,
        cleared: [0, 1, 2, 3],
      }),
    ).toEqual([{ kind: "line", axis: "row", index: 0, piece: 5 }]);
  });

  it("十字同時有橫排與直欄", () => {
    const pieces = [0, 1, 2, 3, 1, 2, 3, 0, 2, 3, 0, 1];
    const specials = none(12);
    specials[0] = "row";
    specials[1] = "row";
    expect(
      planClearFx({
        pieces,
        specials,
        cols: 4,
        rows: 3,
        cleared: [0, 1, 2, 3, 4, 5, 8, 9],
        combo: "cross",
      }),
    ).toEqual([
      { kind: "line", axis: "row", index: 0, piece: 0 },
      { kind: "line", axis: "col", index: 0, piece: 0 },
      { kind: "line", axis: "col", index: 1, piece: 1 },
    ]);
  });

  it("爆炸糖記中心格，彩虹記起點與同色格", () => {
    const pieces = [0, 1, 2, 3, 1, 0, 2, 3, 2, 3, 0, 0];
    const burst = none(12);
    burst[5] = "burst";
    expect(
      planClearFx({
        pieces,
        specials: burst,
        cols: 4,
        rows: 3,
        cleared: [0, 1, 2, 4, 5, 6, 8, 9],
      }),
    ).toEqual([{ kind: "burst", origin: 5 }]);

    const color = none(6);
    color[1] = "color";
    expect(
      planClearFx({
        pieces: [0, 1, 0, 2, 0, 3],
        specials: color,
        cols: 3,
        rows: 2,
        cleared: [0, 1, 2, 4],
      }),
    ).toEqual([{ kind: "color", origin: 1, cells: [1] }]);
  });

  it("兩顆彩虹清盤用一道彩虹；道具掃把與道具彩虹也認得出來", () => {
    const pieces = [0, 1, 2, 1, 3, 0, 2, 0, 1];
    const specials = none(9);
    specials[0] = "color";
    specials[1] = "color";
    const cleared = [0, 1, 2, 3, 5, 6, 7, 8];
    expect(
      planClearFx({ pieces, specials, cols: 3, rows: 3, cleared, combo: "clear-board" }),
    ).toEqual([{ kind: "color", origin: 0, cells: cleared }]);

    const row = [0, 1, 2, 3, 4, 5, 1, 2, 0, 1, 2, 0];
    expect(
      planClearFx({ pieces: row, specials: none(12), cols: 6, rows: 2, cleared: [0, 1, 2, 3, 4, 5] }),
    ).toEqual([{ kind: "line", axis: "row", index: 0, piece: 0 }]);

    const same = [1, 1, 2, 1, 0, 2, 1, 2, 0];
    expect(
      planClearFx({
        pieces: same,
        specials: none(9),
        cols: 3,
        rows: 3,
        cleared: [0, 1, 3, 6],
      }),
    ).toEqual([{ kind: "color", origin: 0, cells: [0, 1, 3, 6] }]);
  });

  it("停留只在特殊招式上多一點，普通消除維持原本 pop 時間", () => {
    expect(MATCH_FX_MS).toBe(CANDY_POP_MS);
    expect(fxHoldMs([])).toBe(MATCH_FX_MS);
    expect(fxHoldMs([{ kind: "line", axis: "row", index: 0 }])).toBe(LINE_FX_MS);
    expect(fxHoldMs([{ kind: "burst", origin: 1 }])).toBe(BURST_FX_MS);
    expect(fxHoldMs([{ kind: "color", origin: 0, cells: [0] }])).toBe(COLOR_FX_MS);
    expect(LINE_FX_MS).toBeLessThanOrEqual(600);
    expect(SHAKE_MS).toBeLessThan(200);
    expect(SHAKE_PX).toBeLessThanOrEqual(4);
  });
});

describe("粒子、彩紙與喇叭", () => {
  it("普通消除有少量粒子，上限 60；減少動態沒有", () => {
    const pieces = Array.from({ length: 20 }, () => 0);
    const cleared = pieces.map((_, i) => i);
    const seeds = matchParticles(pieces, cleared, true);
    expect(particleBudget(seeds.length)).toBe(PARTICLE_CAP);
    expect(seeds.length * PARTICLES_PER_CELL).toBeGreaterThanOrEqual(PARTICLE_CAP);
    expect(matchParticles(pieces, cleared, false)).toEqual([]);
    expect(matchParticles([0, 0, 0], [0, 1, 2], true)).toHaveLength(3);
  });

  it("彩紙張數有上限，位置不靠亂數", () => {
    const pieces = confettiPieces(2);
    expect(pieces).toHaveLength(CONFETTI_COUNT);
    expect(confettiPieces(2)).toEqual(pieces);
    expect(pieces.every((piece) => piece.left >= 0 && piece.left <= 100)).toBe(true);
  });

  it("喇叭是兩聲短方波，音量低", () => {
    expect(HORN_NOTES).toHaveLength(2);
    for (const note of HORN_NOTES) {
      expect(note.type).toBe("square");
      expect(note.dur).toBeLessThan(0.15);
      expect(note.vol).toBeLessThan(0.05);
    }
    expect(HORN_NOTES[1]!.at).toBeGreaterThan(HORN_NOTES[0]!.at);
  });
});
