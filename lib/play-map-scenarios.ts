/**
 * 親子遊樂地圖「今天想怎麼玩？」的四個情境。
 *
 * 情境**不是新的 state**，而是既有篩選欄位的預設組合（不新增 URL 參數）：
 * 下雨也能玩＝rain、跑跳放電＝energy、看展覽＝type 博物館、免費就好＝free。
 * 亮哪張卡一律由 `deriveActiveScenario` 從目前篩選推導，避免和篩選 state 分岔。
 */
import type { PlaygroundType } from "@/data/playgrounds";

export type PlayMapScenarioId = "rainy" | "energy" | "exhibit" | "free";

/** 「看展覽」對應的類型。29 間「博物館」含美術館、水族館與文化園區，所以不叫「玩科學」。 */
export const EXHIBIT_TYPE: PlaygroundType = "博物館";

export type PlayMapScenarioDef = {
  id: PlayMapScenarioId;
  label: string;
  /** e2e 契約：rain／energy／free 沿用舊快捷列的值，看展覽新增 museum。 */
  quickFilter: "rain" | "energy" | "museum" | "free";
};

export const PLAY_MAP_SCENARIOS: readonly PlayMapScenarioDef[] = [
  { id: "rainy", label: "下雨也能玩", quickFilter: "rain" },
  { id: "energy", label: "跑跳放電", quickFilter: "energy" },
  { id: "exhibit", label: "看展覽", quickFilter: "museum" },
  { id: "free", label: "免費就好", quickFilter: "free" },
];

/** 情境相關的四個欄位；其餘條件（推車、停車、室內外、其他類型）屬「更多條件」。 */
export type ScenarioFields = {
  rainyDayOnly: boolean;
  highEnergyOnly: boolean;
  freeOnly: boolean;
  type: PlaygroundType | null;
};

export function scenarioDef(id: PlayMapScenarioId): PlayMapScenarioDef {
  const def = PLAY_MAP_SCENARIOS.find((item) => item.id === id);
  if (!def) throw new Error(`未知的情境：${id}`);
  return def;
}

/** 目前篩選裡「開著」的情境欄位，依卡片順序。 */
export function activeScenarioFlags(state: ScenarioFields): PlayMapScenarioId[] {
  const flags: PlayMapScenarioId[] = [];
  if (state.rainyDayOnly) flags.push("rainy");
  if (state.highEnergyOnly) flags.push("energy");
  if (state.type === EXHIBIT_TYPE) flags.push("exhibit");
  if (state.freeOnly) flags.push("free");
  return flags;
}

/**
 * **恰好一個**情境欄位開著時才回傳它；零個或多個都回傳 null。
 * 舊分享網址（如 `?free=1&rain=1`）不會被任意挑一張亮起來，而是顯示成可見的條件 chip。
 */
export function deriveActiveScenario(state: ScenarioFields): PlayMapScenarioId | null {
  const flags = activeScenarioFlags(state);
  return flags.length === 1 ? flags[0]! : null;
}

/**
 * 點一張情境卡要寫回的完整欄位（一次原子更新 state＋URL）。
 * - 已是唯一亮著的那張 → 取消：只清它自己的欄位。
 * - 否則 → 只留這一個情境：清掉另外三個欄位、設定這一個；更多條件原樣保留。
 *   「看展覽」會覆蓋類型；從看展覽改選別的情境時，類型清成 null。
 */
export function buildScenarioPatch(state: ScenarioFields, id: PlayMapScenarioId): ScenarioFields {
  if (deriveActiveScenario(state) === id) return clearScenarioPatch(state, id);
  const otherType = state.type === EXHIBIT_TYPE ? null : state.type;
  return {
    rainyDayOnly: id === "rainy",
    highEnergyOnly: id === "energy",
    freeOnly: id === "free",
    type: id === "exhibit" ? EXHIBIT_TYPE : otherType,
  };
}

/** 只清掉單一情境的欄位（多情境 chip 的 ✕、或再點一次同一張卡）。 */
export function clearScenarioPatch(state: ScenarioFields, id: PlayMapScenarioId): ScenarioFields {
  return {
    rainyDayOnly: id === "rainy" ? false : state.rainyDayOnly,
    highEnergyOnly: id === "energy" ? false : state.highEnergyOnly,
    freeOnly: id === "free" ? false : state.freeOnly,
    type: id === "exhibit" ? null : state.type,
  };
}

/**
 * 情境卡上的數字要等於「選了這張之後」的結果數：
 * 位置與更多條件照套，情境欄位換成這張卡的組合。
 */
export function scenarioCountState(state: ScenarioFields, id: PlayMapScenarioId): ScenarioFields {
  return buildScenarioPatch({ ...state, ...clearAllScenarioFields(state) }, id);
}

function clearAllScenarioFields(state: ScenarioFields): ScenarioFields {
  return {
    rainyDayOnly: false,
    highEnergyOnly: false,
    freeOnly: false,
    type: state.type === EXHIBIT_TYPE ? null : state.type,
  };
}
