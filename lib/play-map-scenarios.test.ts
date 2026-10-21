import { describe, expect, it } from "vitest";
import { filterPlaygrounds } from "@/lib/playgrounds-query";
import {
  EXHIBIT_TYPE,
  PLAY_MAP_SCENARIOS,
  activeScenarioFlags,
  buildScenarioPatch,
  clearScenarioPatch,
  deriveActiveScenario,
  scenarioCountState,
  type ScenarioFields,
} from "./play-map-scenarios";

const NONE: ScenarioFields = {
  rainyDayOnly: false,
  highEnergyOnly: false,
  freeOnly: false,
  type: null,
};

describe("PLAY_MAP_SCENARIOS", () => {
  it("四張卡依序是雨天、放電、看展覽、免費，quick-filter 沿用舊契約", () => {
    expect(PLAY_MAP_SCENARIOS.map((item) => [item.id, item.label, item.quickFilter])).toEqual([
      ["rainy", "下雨也能玩", "rain"],
      ["energy", "跑跳放電", "energy"],
      ["exhibit", "看展覽", "museum"],
      ["free", "免費就好", "free"],
    ]);
  });
});

describe("deriveActiveScenario", () => {
  it("沒有情境欄位時不亮任何卡", () => {
    expect(deriveActiveScenario(NONE)).toBeNull();
  });

  it("恰好一個情境欄位時亮那一張", () => {
    expect(deriveActiveScenario({ ...NONE, rainyDayOnly: true })).toBe("rainy");
    expect(deriveActiveScenario({ ...NONE, highEnergyOnly: true })).toBe("energy");
    expect(deriveActiveScenario({ ...NONE, type: EXHIBIT_TYPE })).toBe("exhibit");
    expect(deriveActiveScenario({ ...NONE, freeOnly: true })).toBe("free");
  });

  it("其他類型（例如公園）不算情境", () => {
    expect(deriveActiveScenario({ ...NONE, type: "公園" })).toBeNull();
    expect(deriveActiveScenario({ ...NONE, type: "公園", freeOnly: true })).toBe("free");
  });

  it("舊網址同時帶多個情境參數時不任意挑一張亮", () => {
    const state = { ...NONE, rainyDayOnly: true, freeOnly: true };
    expect(deriveActiveScenario(state)).toBeNull();
    expect(activeScenarioFlags(state)).toEqual(["rainy", "free"]);
  });
});

describe("buildScenarioPatch", () => {
  it("點一張：只留這個情境，另外三個欄位清掉", () => {
    const state = { ...NONE, rainyDayOnly: true, freeOnly: true };
    expect(buildScenarioPatch(state, "energy")).toEqual({
      rainyDayOnly: false,
      highEnergyOnly: true,
      freeOnly: false,
      type: null,
    });
  });

  it("再點同一張：只清它自己的欄位", () => {
    const state = { ...NONE, freeOnly: true, type: "公園" as const };
    expect(buildScenarioPatch(state, "free")).toEqual({ ...state, freeOnly: false });
  });

  it("看展覽會覆蓋類型；從看展覽改選別的情境時類型清成 null", () => {
    const parks = { ...NONE, type: "公園" as const };
    expect(buildScenarioPatch(parks, "exhibit").type).toBe(EXHIBIT_TYPE);
    const exhibit = { ...NONE, type: EXHIBIT_TYPE };
    expect(buildScenarioPatch(exhibit, "rainy")).toEqual({ ...NONE, rainyDayOnly: true });
  });

  it("選雨天時保留更多條件裡的其他類型", () => {
    const parks = { ...NONE, type: "公園" as const };
    expect(buildScenarioPatch(parks, "rainy")).toEqual({ ...parks, rainyDayOnly: true });
  });

  it("取消看展覽把類型清掉", () => {
    expect(clearScenarioPatch({ ...NONE, type: EXHIBIT_TYPE }, "exhibit").type).toBeNull();
  });
});

describe("scenarioCountState", () => {
  it("情境卡上的數字等於選了那張之後的結果數", () => {
    const base = { ...NONE, rainyDayOnly: true };
    for (const { id } of PLAY_MAP_SCENARIOS) {
      const countState = scenarioCountState(base, id);
      const afterSelect = buildScenarioPatch(base, id);
      // 對目前亮著的那張，「選了之後」就是保持亮著（不是取消）。
      const expected = deriveActiveScenario(base) === id ? base : afterSelect;
      expect(countState).toEqual(expected);
    }
  });

  it("用真實資料：全台四個情境的筆數", () => {
    const count = (state: ScenarioFields) =>
      filterPlaygrounds({
        rainyDayOnly: state.rainyDayOnly,
        highEnergyOnly: state.highEnergyOnly,
        freeOnly: state.freeOnly,
        type: state.type ?? undefined,
      }).length;
    expect(count(scenarioCountState(NONE, "rainy"))).toBe(34);
    expect(count(scenarioCountState(NONE, "energy"))).toBe(41);
    expect(count(scenarioCountState(NONE, "exhibit"))).toBe(29);
    expect(count(scenarioCountState(NONE, "free"))).toBe(58);
  });
});
