"use client";

import { useCallback, useMemo } from "react";
import type { PlaygroundType } from "@/data/playgrounds";
import {
  filterPlaygrounds,
  type PlayMapQuery,
  type PlaygroundBounds,
} from "@/lib/playgrounds-query";
import {
  PLAY_MAP_SCENARIOS,
  activeScenarioFlags,
  buildScenarioPatch,
  clearScenarioPatch,
  deriveActiveScenario,
  scenarioCountState,
  type PlayMapScenarioId,
  type ScenarioFields,
} from "@/lib/play-map-scenarios";

export type UsePlayMapScenariosArgs = {
  city: string | null;
  indoorOnly: boolean;
  outdoorOnly: boolean;
  parkingOnly: boolean;
  strollerFriendlyOnly: boolean;
  viewportBounds: PlaygroundBounds | null;
  rainyDayOnly: boolean;
  highEnergyOnly: boolean;
  freeOnly: boolean;
  typeFilter: PlaygroundType | null;
  /** usePlayMapFilters 的原子更新：一次 set 多個欄位＋一次寫網址。 */
  applyFilterPatch: (patch: Partial<Omit<PlayMapQuery, "view">>) => void;
};

export type PlayMapScenarioModel = {
  /** 恰好一個情境欄位開著才有值；零個或多個都是 null。 */
  activeScenario: PlayMapScenarioId | null;
  /** 目前開著的情境欄位（多個時要以可見 chip 列出）。 */
  scenarioFlags: readonly PlayMapScenarioId[];
  /** 每張情境卡選了之後的結果數。 */
  scenarioCounts: ReadonlyMap<PlayMapScenarioId, number>;
  handleSelectScenario: (id: PlayMapScenarioId) => void;
  handleClearScenario: (id: PlayMapScenarioId) => void;
};

/**
 * 「今天想怎麼玩？」情境卡的狀態投影。
 * 情境不是新的 state，是 rain／energy／type=博物館／free 四個既有欄位的預設組合；
 * 這裡只負責推導與一次性寫回，真正的 state 仍在 usePlayMapFilters。
 */
export function usePlayMapScenarios(args: UsePlayMapScenariosArgs): PlayMapScenarioModel {
  const {
    city,
    indoorOnly,
    outdoorOnly,
    parkingOnly,
    strollerFriendlyOnly,
    viewportBounds,
    rainyDayOnly,
    highEnergyOnly,
    freeOnly,
    typeFilter,
    applyFilterPatch,
  } = args;

  const scenarioFields = useMemo<ScenarioFields>(
    () => ({ rainyDayOnly, highEnergyOnly, freeOnly, type: typeFilter }),
    [freeOnly, highEnergyOnly, rainyDayOnly, typeFilter],
  );
  const activeScenario = deriveActiveScenario(scenarioFields);
  const scenarioFlags = useMemo(() => activeScenarioFlags(scenarioFields), [scenarioFields]);

  const handleSelectScenario = useCallback(
    (id: PlayMapScenarioId) => applyFilterPatch(buildScenarioPatch(scenarioFields, id)),
    [applyFilterPatch, scenarioFields],
  );

  const handleClearScenario = useCallback(
    (id: PlayMapScenarioId) => applyFilterPatch(clearScenarioPatch(scenarioFields, id)),
    [applyFilterPatch, scenarioFields],
  );

  const scenarioCounts = useMemo(() => {
    const counts = new Map<PlayMapScenarioId, number>();
    for (const { id } of PLAY_MAP_SCENARIOS) {
      const next = scenarioCountState(scenarioFields, id);
      counts.set(
        id,
        filterPlaygrounds({
          city: city ?? undefined,
          indoorOnly,
          outdoorOnly,
          parkingOnly,
          strollerFriendlyOnly,
          bounds: viewportBounds ?? undefined,
          rainyDayOnly: next.rainyDayOnly,
          highEnergyOnly: next.highEnergyOnly,
          freeOnly: next.freeOnly,
          type: next.type ?? undefined,
        }).length,
      );
    }
    return counts;
  }, [city, indoorOnly, outdoorOnly, parkingOnly, scenarioFields, strollerFriendlyOnly, viewportBounds]);

  return { activeScenario, scenarioFlags, scenarioCounts, handleSelectScenario, handleClearScenario };
}
