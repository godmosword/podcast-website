import { describe, expect, it } from "vitest";
import { CAR_ADVENTURE_LEVELS } from "@/lib/games/car-adventure/levels";
import { WORLD_THEMES } from "@/lib/games/car-adventure/render";
import {
  levelFromJson,
  type AdventureLevelJson,
} from "@/lib/gamekit/games/adventure-level";

describe("adventure levels", () => {
  it("CAR_ADVENTURE_LEVELS 可轉為執行期關卡", () => {
    for (const json of CAR_ADVENTURE_LEVELS) {
      const lv = levelFromJson(json);
      expect(lv.solid.size).toBeGreaterThan(0);
      expect(lv.total).toBe((json.coins?.length ?? 0) + (json.secrets?.length ?? 0));
      expect(lv.worldW).toBe(json.cols * json.tileSize);
      expect(lv.targetTime).toBe(json.targetTime ?? 0);
    }
  });
});

describe("S1 plumbing：breakable/secrets/abilityGates/movingPlatforms 帶入 runtime", () => {
  it("新欄位 runtime 數量鏡射 JSON（未定義即空）", () => {
    for (const json of CAR_ADVENTURE_LEVELS) {
      const lv = levelFromJson(json);
      expect(lv.breakable.size).toBe(json.breakable?.length ?? 0);
      expect(lv.secrets.size).toBe(json.secrets?.length ?? 0);
      expect(lv.abilityGates).toHaveLength(json.abilityGates?.length ?? 0);
      expect(lv.abilities.size).toBe(json.abilities?.length ?? 0);
      expect(lv.movingPlatforms).toHaveLength(json.movingPlatforms?.length ?? 0);
    }
  });

  it("提供新欄位時正確 tile→pixel 映射", () => {
    const json: AdventureLevelJson = {
      id: "t",
      name: "t",
      tileSize: 36,
      cols: 10,
      rows: 12,
      solid: ["0,11"],
      start: [1, 10],
      finish: [8, 9],
      breakable: ["3,5", "3,6"],
      secrets: ["7,2"],
      abilityGates: [{ x: 4, y: 8, ability: "dash" }],
      abilities: ["dash", "break"],
      movingPlatforms: [
        { x: 2, y: 6, w: 3, axis: "y", range: 2, speed: 40 },
      ],
    };
    const lv = levelFromJson(json);

    expect([...lv.breakable].sort()).toEqual(["3,5", "3,6"]);
    expect(lv.secrets.has("7,2")).toBe(true);
    expect([...lv.abilities]).toEqual(["dash", "break"]);

    expect(lv.abilityGates).toEqual([
      { x: 144, y: 288, w: 36, h: 72, ability: "dash" },
    ]);

    expect(lv.movingPlatforms).toEqual([
      {
        x: 72,
        y: 216,
        x0: 72,
        y0: 216,
        w: 108,
        h: 18,
        axis: "y",
        range: 72,
        speed: 40,
        dir: 1,
      },
    ]);
  });

  it("含移動平台的關卡：地面缺口 ≤3 格（平台靜止/reduced 仍可跳過通關）", () => {
    function maxGroundGap(json: (typeof CAR_ADVENTURE_LEVELS)[number]): number {
      const solid = new Set(json.solid);
      let maxGap = 0;
      let cur = 0;
      for (let x = 0; x < json.cols; x++) {
        if (solid.has(`${x},10`)) cur = 0;
        else {
          cur++;
          if (cur > maxGap) maxGap = cur;
        }
      }
      return maxGap;
    }
    const withPlatforms = CAR_ADVENTURE_LEVELS.filter(
      (l) => (l.movingPlatforms?.length ?? 0) > 0,
    );
    expect(withPlatforms.length).toBeGreaterThan(0);
    for (const json of withPlatforms) {
      expect(maxGroundGap(json)).toBeLessThanOrEqual(3);
    }
  });

  it("enemies 映射 kind（預設 patrol）與行為欄位", () => {
    const json: AdventureLevelJson = {
      id: "t",
      name: "t",
      tileSize: 36,
      cols: 10,
      rows: 12,
      solid: ["0,11"],
      start: [1, 10],
      finish: [8, 9],
      enemies: [
        { x: 5, y: 9 },
        { x: 8, y: 6, kind: "floater" },
      ],
    };
    const lv = levelFromJson(json);
    expect(lv.enemies[0].kind).toBe("patrol");
    expect(lv.enemies[1].kind).toBe("floater");
    expect(lv.enemies[0]).toMatchObject({ vy: 0, t: 0, hopTimer: 0 });
    expect(lv.enemies[0].baseY).toBe(lv.enemies[0].y);
  });

  it("movingPlatform 缺省：w=2 格、axis=x、range/speed=0", () => {
    const json: AdventureLevelJson = {
      id: "t",
      name: "t",
      tileSize: 36,
      cols: 10,
      rows: 12,
      solid: ["0,11"],
      start: [1, 10],
      finish: [8, 9],
      movingPlatforms: [{ x: 1, y: 1 }],
    };
    const [p] = levelFromJson(json).movingPlatforms;
    expect(p).toMatchObject({ w: 72, axis: "x", range: 0, speed: 0, dir: 1 });
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

  it("共有 8 關（新增工坊與月光終點）", () => {
    expect(CAR_ADVENTURE_LEVELS).toHaveLength(8);
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

  it("每關都有正的三星時間門檻", () => {
    for (const json of CAR_ADVENTURE_LEVELS) {
      expect(json.targetTime).toBeGreaterThan(0);
    }
  });

  it("每一關都有對應的主題配色（含 glow）", () => {
    expect(WORLD_THEMES).toHaveLength(CAR_ADVENTURE_LEVELS.length);
    for (const theme of WORLD_THEMES) {
      expect(theme.glow).toMatch(/^rgba\(/);
    }
  });

  it("新關綜合使用 Phase 2/3 機制，能力門都有當關能力", () => {
    for (const json of CAR_ADVENTURE_LEVELS.slice(6)) {
      expect(json.breakable?.length ?? 0).toBeGreaterThan(0);
      expect(json.movingPlatforms?.length ?? 0).toBeGreaterThan(0);
      expect(json.enemies?.some((e) => e.kind === "hopper")).toBe(true);
      expect(json.enemies?.some((e) => e.kind === "floater")).toBe(true);
      expect(json.secrets?.length ?? 0).toBeGreaterThan(0);
      expect(json.abilityGates?.length ?? 0).toBeGreaterThan(0);
      for (const gate of json.abilityGates ?? []) {
        expect(json.abilities ?? []).toContain(gate.ability);
      }
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
