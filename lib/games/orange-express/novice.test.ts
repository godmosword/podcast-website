import { describe, expect, it } from "vitest";
import { noviceRun, noviceStats } from "@/lib/games/orange-express/novice";
import { createRun } from "@/lib/games/orange-express/reducer";

const SEEDS = Array.from({ length: 24 }, (_, i) => i);

describe("新手腳本量一趟多久（PR-H4）", () => {
  it("大司機：每種排法都開得完、五件事件都做到；中位數與範圍在預期內", () => {
    for (const seed of SEEDS.slice(0, 6)) {
      const { state } = noviceRun("drive", "big", seed);
      expect(state.phase).toBe("route-done");
      expect(Object.values(state.events).filter((result) => result === "done")).toHaveLength(5);
    }
    const stats = noviceStats(SEEDS);
    console.info(`新手腳本 大司機 中位數 ${stats.median.toFixed(1)} 秒（${stats.min.toFixed(1)}–${stats.max.toFixed(1)}）`);
    // 有旅程約是沒旅程的兩倍半；真的孩子比腳本慢，第一次試玩的舊版不到 2 分鐘 → 推估約 3 分鐘。
    expect(stats.median).toBeGreaterThan(90);
    expect(stats.median).toBeLessThan(130);
    expect(stats.max - stats.min).toBeLessThan(15);
  });

  it("沒有旅程的同一條路（舊版大司機）只要一半不到", () => {
    const run = createRun("drive", "big", 0);
    const flat = { ...run, progress: 0, stations: run.stations.map((st) => ({ ...st, scenic: [], slowZones: [] })) };
    const journey = noviceRun("drive", "big", 0).seconds;
    const plain = noviceRun("drive", "big", 0, undefined, 900, flat).seconds;
    console.info(`新手腳本 有旅程 ${journey.toFixed(1)} 秒、沒有旅程 ${plain.toFixed(1)} 秒`);
    expect(journey / plain).toBeGreaterThan(2.2);
  });

  it("小小司機沒有旅程：長度不變", () => {
    const { seconds, state } = noviceRun("drive", "little", 0);
    expect(state.phase).toBe("route-done");
    expect(seconds).toBeLessThan(50);
  });
});
