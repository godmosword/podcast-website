import { describe, expect, it } from "vitest";
import { NOVICE, noviceRun, noviceStats } from "@/lib/games/orange-express/novice";
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
    // PR-I1 後兩邊都變長（慢有目標速度、照示範拉得晚一點停在綠區正中間），比例從約 2.5 變約 2.2。
    // PR-J1 起照駕駛台亮的做：出站先推動力、等「鬆」亮了才放煞車，每次出站多約 3 秒，沒旅程的比例上變長得多，約 2.1。
    expect(journey / plain).toBeGreaterThan(2);
  });

  it("小站長（PR-I4 起有旅程）：每種排法都開得完；比大司機長一點（紅燈等對向列車、指差、窄綠區）", () => {
    const times = SEEDS.slice(0, 6).map((seed) => {
      const { seconds, state } = noviceRun("captain", "big", seed);
      expect(state.phase).toBe("route-done");
      return seconds;
    });
    const median = [...times].sort((a, b) => a - b)[3]!;
    console.info(`新手腳本 小站長 約 ${median.toFixed(1)} 秒`);
    expect(median).toBeGreaterThan(noviceStats(SEEDS.slice(0, 6)).median);
    expect(median).toBeLessThan(240);
  });

  it("小小司機沒有旅程：不到一分鐘（PR-J1 出站等「鬆」亮，多約 1 秒）", () => {
    const { seconds, state } = noviceRun("drive", "little", 0);
    expect(state.phase).toBe("route-done");
    expect(seconds).toBeLessThan(55);
  });

  it("照駕駛台亮的做，四組都開得完", () => {
    for (const [level, driver] of [["look", "big"], ["drive", "little"], ["drive", "big"], ["captain", "big"]] as const) {
      const { state } = noviceRun(level, driver, 3);
      expect(state.phase, `${level}/${driver}`).toBe("route-done");
    }
  });

  it("照亮的準時拉（不故意晚拉）：小小司機、大司機每站都停在綠區，30fps、60fps、幀間隔不穩都一樣", () => {
    const onTime = { ...NOVICE, lateBrake: NOVICE.brakeReact };
    const frames: Record<string, (frame: number) => number> = {
      "30fps": () => 1 / 30,
      "60fps": () => 1 / 60,
      不穩: (frame) => [1 / 60, 1 / 24, 1 / 45, 1 / 30][frame % 4]!,
    };
    for (const driver of ["little", "big"] as const) {
      for (const [name, dtAt] of Object.entries(frames)) {
        const { state } = noviceRun("drive", driver, 1, onTime, 900, undefined, dtAt);
        expect(state.grades, `${driver} ${name}`).toEqual(["green", "green", "green"]);
        expect(state.misses, `${driver} ${name}`).toBe(0);
      }
    }
  });
});
