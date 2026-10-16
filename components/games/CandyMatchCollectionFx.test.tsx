// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { collectionFlights } from "./CandyMatchCollectionFx";
import { emptySpecials } from "@/lib/games/candy-match/engine";
import { freshCandyProgress } from "@/lib/games/candy-match/tasks";

const board = { cols: 3, rows: 2, pieces: [0, 0, 0, 1, 1, -2], dirt: [0, 0, 0, 0, 0, 0], specials: emptySpecials(6) };
const popping = new Set([0, 1, 2, 3, 4, 5]);
describe("收集飛行", () => {
  it("只飛向未完成的對應目標，每項最多兩台，禮物不混入車車", () => {
    const progress = freshCandyProgress();
    progress.collected[0] = 4;
    expect(collectionFlights(board, popping, [
      { kind: "collect", piece: 0, count: 5 }, { kind: "collect", piece: 1, count: 2 },
      { kind: "drop-item", count: 2 },
    ], progress)).toEqual([
      { cell: 0, piece: 0, goal: 0 }, { cell: 3, piece: 1, goal: 1 }, { cell: 4, piece: 1, goal: 1 },
    ]);
    progress.collected[0] = 5;
    expect(collectionFlights(board, popping, [{ kind: "collect", piece: 0, count: 5 }], progress)).toEqual([]);
  });
  it("整波最多六台", () => {
    expect(collectionFlights(board, popping, Array.from({ length: 4 }, () => ({ kind: "collect-any" as const, count: 50 })), freshCandyProgress())).toHaveLength(6);
  });
});
