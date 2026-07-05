import { describe, expect, it } from "vitest";
import { CAR_ADVENTURE_LEVELS } from "@/lib/games/car-adventure/levels";
import { levelFromJson } from "@/lib/gamekit/games/adventure-level";

describe("adventure levels", () => {
  it("CAR_ADVENTURE_LEVELS 可轉為執行期關卡", () => {
    for (const json of CAR_ADVENTURE_LEVELS) {
      const lv = levelFromJson(json);
      expect(lv.solid.size).toBeGreaterThan(0);
      expect(lv.total).toBe(json.coins?.length ?? 0);
      expect(lv.worldW).toBe(json.cols * json.tileSize);
    }
  });
});

describe("car-adventure 關卡升級", () => {
  type LevelJson = (typeof CAR_ADVENTURE_LEVELS)[number];

  /** 難度量化：長度 + 敵人 + 尖刺。用於驗證曲線不倒退。 */
  function difficultyScore(json: LevelJson): number {
    return (
      json.cols +
      (json.enemies?.length ?? 0) * 8 +
      (json.spikes?.length ?? 0) * 6
    );
  }

  it("共有 6 關（解決時長過短）", () => {
    expect(CAR_ADVENTURE_LEVELS).toHaveLength(6);
  });

  it("每關 id 唯一且 name 非空", () => {
    const ids = CAR_ADVENTURE_LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of CAR_ADVENTURE_LEVELS) {
      expect(l.name.length).toBeGreaterThan(0);
    }
  });

  it("難度曲線單調遞增（後關嚴格高於前關，修正第二關倒退）", () => {
    for (let i = 1; i < CAR_ADVENTURE_LEVELS.length; i++) {
      expect(difficultyScore(CAR_ADVENTURE_LEVELS[i])).toBeGreaterThan(
        difficultyScore(CAR_ADVENTURE_LEVELS[i - 1]),
      );
    }
  });

  it("每關地圖夠長（cols >= 100，避免秒破）", () => {
    for (const json of CAR_ADVENTURE_LEVELS) {
      expect(json.cols).toBeGreaterThanOrEqual(100);
    }
  });

  it("每關起點合法、終點在右半、金幣 > 0", () => {
    for (const json of CAR_ADVENTURE_LEVELS) {
      const [sx, sy] = json.start;
      expect(sx).toBeGreaterThanOrEqual(0);
      expect(sx).toBeLessThan(json.cols);
      expect(sy).toBeGreaterThanOrEqual(0);
      expect(sy).toBeLessThan(json.rows);
      const solid = new Set(json.solid);
      expect(solid.has(`${sx},${sy}`)).toBe(false);
      const [fx] = json.finish;
      expect(fx).toBeLessThan(json.cols);
      expect(fx).toBeGreaterThan(json.cols / 2);
      expect(json.coins?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("每個尖刺正下方都有地形支撐（不是懸空陷阱）", () => {
    for (const json of CAR_ADVENTURE_LEVELS) {
      const solid = new Set(json.solid);
      for (const s of json.spikes ?? []) {
        const [x, y] = s.split(",").map(Number);
        expect(solid.has(`${x},${y + 1}`)).toBe(true);
      }
    }
  });
});
