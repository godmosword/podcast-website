import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  candyKartSessionFromFinish,
  type CandyKartFinishMessage,
} from "./candy-kart-bridge";

const ROOT = process.cwd();

/** GameSessionResult 允許欄位（blueprint S0 契約：bridge 只可映射入既有形狀）。 */
const GAME_SESSION_RESULT_KEYS = [
  "gameId",
  "score",
  "levelIndex",
  "cleared",
  "flawless",
  "collectedAll",
] as const;

/** 代表性完整 finish 訊息（作為 TS 型別欄位集合的執行期代理）。 */
const FULL_FINISH_MESSAGE: CandyKartFinishMessage = {
  source: "cheche-candy-kart",
  type: "race-finish",
  trackId: "macaron-meadow",
  playerPos: 1,
  totalMs: 50_000,
  bestLapMs: 16_000,
  starsCollected: 7,
  starsTotal: 7,
};

describe("iframe-bridge", () => {
  it("finish 訊息映射分數：時間越短分數越高", () => {
    const base: CandyKartFinishMessage = {
      source: "cheche-candy-kart",
      type: "race-finish",
      trackId: "macaron-meadow",
      playerPos: 1,
      totalMs: 50_000,
      bestLapMs: 16_000,
      starsCollected: 7,
      starsTotal: 7,
    };
    expect(candyKartSessionFromFinish(base).score).toBe(20);
    expect(candyKartSessionFromFinish({ ...base, totalMs: 25_000 }).score).toBe(40);
    expect(candyKartSessionFromFinish({ ...base, totalMs: 0 }).score).toBe(0);
  });
});

/**
 * blueprint S0 契約鎖定：Candy Kart bridge 與 Godot／GameSessionResult 相容性。
 */
describe("契約：bridge 只映射入 GameSessionResult 既有形狀", () => {
  it("candyKartSessionFromFinish 輸出鍵 ⊆ GameSessionResult 允許鍵", () => {
    const result = candyKartSessionFromFinish(FULL_FINISH_MESSAGE);
    for (const key of Object.keys(result)) {
      expect(GAME_SESSION_RESULT_KEYS).toContain(key);
    }
    // 完整 track 應帶出三星判定欄位（sanity）
    expect(result).toMatchObject({
      gameId: "candy-kart",
      cleared: true,
      collectedAll: true,
    });
  });
});

describe("契約：bridge.gd ↔ TS 訊息欄位雙向 parity（M4）", () => {
  const gdPath = join(ROOT, "candy-kart-game/scripts/bridge.gd");

  it("bridge.gd 存在", () => {
    expect(existsSync(gdPath)).toBe(true);
  });

  it("gd 送出的 JS 欄位集合 === TS finish 欄位集合（互為子集）", () => {
    const gd = readFileSync(gdPath, "utf8");
    // 擷取 dict 字面量的 JS-facing key：形如 `"word":`
    const gdKeys = new Set(
      [...gd.matchAll(/"([a-zA-Z][a-zA-Z0-9]*)"\s*:/g)].map((m) => m[1]),
    );
    const tsFinishKeys = new Set(Object.keys(FULL_FINISH_MESSAGE));
    // ready 訊息只用 source/type，屬 finish 欄位子集
    const tsAllKeys = new Set([...tsFinishKeys, "source", "type"]);

    // 每個 TS finish 欄位都由 gd 送出
    for (const k of tsFinishKeys) {
      expect(gdKeys, `TS 欄位 ${k} 須存在於 bridge.gd`).toContain(k);
    }
    // gd 不得送出 TS 未知的欄位
    for (const k of gdKeys) {
      expect(tsAllKeys, `bridge.gd 欄位 ${k} 須為 TS 已知`).toContain(k);
    }
  });
});

describe("契約：Candy Kart Godot 匯出產物存在且非空（S0 smoke）", () => {
  it.each(["index.html", "index.js", "index.wasm", "index.pck"])(
    "public/candy-kart/%s 存在且非空",
    (file) => {
      const p = join(ROOT, "public/candy-kart", file);
      expect(existsSync(p), `${file} 應存在`).toBe(true);
      expect(statSync(p).size, `${file} 應非空`).toBeGreaterThan(0);
    },
  );
});
