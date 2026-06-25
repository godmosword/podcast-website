import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GAME_VIEWPORTS,
  FIXED_DT,
} from "@/lib/gamekit/runtime/constants";
import {
  colorsForGame,
  snapPixel,
} from "@/lib/gamekit/runtime/palette";
import { computeIntegerScale } from "@/lib/gamekit/runtime/renderer";
import {
  BLOCK_INDEX,
  TILE_INDEX,
  TILE_SIZE,
} from "@/lib/gamekit/runtime/procedural-sheets";
import { medalCount, medalFlags } from "@/lib/gamekit/progress/meta";
import {
  BGM_THEMES,
  validateBgmTheme,
} from "@/lib/gamekit/runtime/chiptune-bgm";
import {
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
} from "@/lib/gamekit/runtime/audio";
import {
  easeOutQuad,
  easeOutCubic,
  tweenToward,
  JuiceController,
} from "@/lib/gamekit/runtime/juice";
import { levelFromJson } from "@/lib/gamekit/games/adventure-level";
import { CAR_ADVENTURE_LEVELS } from "@/lib/games/car-adventure/levels";
import {
  recordBestScore,
  loadPlayerProfile,
  recordMedal,
  addStars,
} from "@/lib/gamekit/progress/save";
import {
  GARAGE_VEHICLES,
  vehiclesUnlockedAt,
} from "@/lib/gamekit/progress/garage";
import {
  reportGameSession,
  gameMedalStars,
} from "@/lib/gamekit/progress/session";
import {
  BLOCK_DROP_DIFFICULTIES,
  BLOCK_DROP_SPECIAL_MODES,
  loadGameKitSettings,
  setBlockDropDifficulty,
  setBlockDropSpecialMode,
  setKidsMode,
} from "@/lib/gamekit/progress/settings";
import { GAME_PRELOAD_SHEETS } from "@/lib/gamekit/runtime/preload";
import { GameLoop } from "@/lib/gamekit/runtime/loop";

describe("gamekit constants", () => {
  it("Game Kit viewport 為正整數", () => {
    for (const [id, vp] of Object.entries(GAME_VIEWPORTS)) {
      expect(vp.width).toBeGreaterThan(0);
      expect(vp.height).toBeGreaterThan(0);
      expect(id).toMatch(/^car-adventure$|^block-drop$|^candy-kart$|^candy-match$/);
    }
  });
});

describe("computeIntegerScale", () => {
  const vp = { width: 320, height: 240 };

  it("容器足夠大時使用最大整數倍且不超過 maxScale", () => {
    const r = computeIntegerScale(vp, 640, 480, 4);
    expect(r.scale).toBe(2);
    expect(r.displayWidth).toBe(640);
    expect(r.displayHeight).toBe(480);
    expect(r.offsetX).toBe(0);
    expect(r.offsetY).toBe(0);
  });

  it("容器較小時 letterbox 置中", () => {
    const r = computeIntegerScale(vp, 400, 300, 4);
    expect(r.scale).toBe(1);
    expect(r.displayWidth).toBe(320);
    expect(r.displayHeight).toBe(240);
    expect(r.offsetX).toBe(40);
    expect(r.offsetY).toBe(30);
  });

  it("容器為零時 fallback scale 1", () => {
    const r = computeIntegerScale(vp, 0, 0);
    expect(r.scale).toBe(1);
  });
});

describe("palette", () => {
  it("snapPixel 四捨五入", () => {
    expect(snapPixel(1.4)).toBe(1);
    expect(snapPixel(1.6)).toBe(2);
  });

  it("colorsForGame 回傳子調色盤", () => {
    const c = colorsForGame("car-adventure");
    expect(c.length).toBeGreaterThan(0);
    expect(c[0]).toMatch(/^#/);
  });
});

describe("meta medals", () => {
  it("medalFlags 與 medalCount", () => {
    const f = medalFlags(true, true, false);
    expect(f).toBe(3);
    expect(medalCount(f)).toBe(2);
  });
});

describe("save", () => {
  it("recordBestScore 只在新高分時更新", () => {
    const base = loadPlayerProfile();
    const next = recordBestScore(base, "car-adventure", 100);
    expect(next.bests["car-adventure"]).toBe(100);
    const same = recordBestScore(next, "car-adventure", 50);
    expect(same.bests["car-adventure"]).toBe(100);
  });

  it("recordMedal 合併三星 bit", () => {
    const base = loadPlayerProfile();
    const f1 = medalFlags(true, false, false);
    const f2 = medalFlags(false, true, true);
    let p = recordMedal(base, "car-adventure", 0, f1);
    p = recordMedal(p, "car-adventure", 0, f2);
    expect(medalCount(p.medals["car-adventure"]?.[0] ?? 0)).toBe(3);
  });

  it("addStars 解鎖車庫車輛", () => {
    const base = loadPlayerProfile();
    const p = addStars(base, 6);
    expect(p.stars).toBe(6);
    expect(p.unlockedVehicles).toContain("怪獸卡車");
    expect(p.unlockedVehicles).toContain("小紅賽車");
  });
});

describe("garage", () => {
  it("vehiclesUnlockedAt 依星星門檻", () => {
    expect(vehiclesUnlockedAt(0)).toEqual(["小黃"]);
    expect(vehiclesUnlockedAt(3)).toContain("怪獸卡車");
    expect(GARAGE_VEHICLES.length).toBe(5);
  });
});

describe("preload manifest", () => {
  it("Game Kit 遊戲皆有 sheet 清單", () => {
    for (const id of ["car-adventure", "block-drop"] as const) {
      expect(GAME_PRELOAD_SHEETS[id].length).toBeGreaterThan(0);
    }
  });
});

describe("GameLoop", () => {
  it("FIXED_DT 錨定 120Hz", () => {
    expect(FIXED_DT).toBeCloseTo(1 / 120, 5);
  });

  it("GameLoop 初始為未執行", () => {
    const loop = new GameLoop();
    expect(loop.isRunning).toBe(false);
    loop.stop();
    expect(loop.isRunning).toBe(false);
  });
});

describe("settings", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("預設開啟兒童模式", () => {
    expect(loadGameKitSettings().kidsMode).toBe(true);
  });

  it("setKidsMode 可切換", () => {
    const off = setKidsMode(false);
    expect(off.kidsMode).toBe(false);
    setKidsMode(true);
  });

  it("繽紛方塊預設使用輕鬆難度與經典模式", () => {
    const settings = loadGameKitSettings();

    expect(BLOCK_DROP_DIFFICULTIES.map((d) => d.id)).toEqual([
      "relaxed",
      "standard",
      "challenge",
    ]);
    expect(BLOCK_DROP_SPECIAL_MODES.map((m) => m.id)).toEqual([
      "classic",
      "rainbow",
    ]);
    expect(settings.blockDropDifficulty).toBe("relaxed");
    expect(settings.blockDropSpecialMode).toBe("classic");
  });

  it("繽紛方塊難度與特殊模式可儲存", () => {
    const hard = setBlockDropDifficulty("challenge");
    expect(hard.blockDropDifficulty).toBe("challenge");

    const rainbow = setBlockDropSpecialMode("rainbow");
    expect(rainbow.blockDropDifficulty).toBe("challenge");
    expect(rainbow.blockDropSpecialMode).toBe("rainbow");

    setBlockDropDifficulty("relaxed");
    setBlockDropSpecialMode("classic");
  });
});

describe("session", () => {
  it("reportGameSession 通關發星與貼紙", () => {
    const cleared = reportGameSession({
      gameId: "car-adventure",
      score: 500,
      levelIndex: 0,
      cleared: true,
      flawless: true,
      collectedAll: true,
    });
    expect(cleared.gamesPlayed["car-adventure"]).toBe(true);
    expect(cleared.stickers).toContain("played-car-adventure");
    expect(cleared.stars).toBeGreaterThan(0);
    expect(gameMedalStars(cleared, "car-adventure")).toBeGreaterThan(0);
    expect(cleared.bests["car-adventure"]).toBe(500);
  });
});

describe("procedural sheets index", () => {
  it("TILE_INDEX 與 BLOCK_INDEX 對齊七種方塊", () => {
    expect(TILE_SIZE).toBe(16);
    expect(TILE_INDEX.road).toBe(0);
    expect(BLOCK_INDEX.I).toBe(0);
    expect(BLOCK_INDEX.L).toBe(6);
    expect(Object.keys(BLOCK_INDEX)).toHaveLength(7);
  });
});

describe("juice", () => {
  it("緩動與 tween 單調", () => {
    expect(easeOutQuad(0)).toBe(0);
    expect(easeOutQuad(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    const next = tweenToward(0, 10, 8, 0.1);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });

  it("JuiceController burst 不拋錯", () => {
    const j = new JuiceController();
    j.burst(10, 10, 4, "#fff");
    const r = j.update(0.016);
    expect(r.shakeX).toBeDefined();
  });
});

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

describe("chiptune BGM", () => {
  it("Game Kit 主題通過 validateBgmTheme", () => {
    for (const [id, theme] of Object.entries(BGM_THEMES)) {
      expect(validateBgmTheme(theme), id).toBe(true);
      expect(theme.bpm).toBeGreaterThan(60);
    }
  });

  it("createAudioBus 預設音量在合理範圍", () => {
    expect(DEFAULT_MUSIC_VOLUME).toBeGreaterThan(0);
    expect(DEFAULT_MUSIC_VOLUME).toBeLessThan(DEFAULT_SFX_VOLUME);
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
