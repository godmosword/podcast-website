"use client";

import { useMemo } from "react";
import type { PlaygroundType, Playground } from "@/data/playgrounds";
import {
  buildPlayMapRegions,
  listUncataloguedCities,
  type PlayMapRegion,
} from "@/lib/play-map-regions";
import {
  DRIVE_GROUP_NOTE,
  groupPlayMapResults,
  resolvePlayMapGroupMode,
  type PlayMapGroupMode,
  type PlayMapResultGroup,
} from "@/lib/play-map-groups";
import {
  playMapResultSentence,
  type PlayMapResultSentenceView,
} from "@/lib/play-map-copy";
import type { LatLng } from "@/lib/playground-distance";

/**
 * 瀏覽層的衍生資料。
 *
 * 這些全是 filter 狀態的純投影（縣市分組、名單分組、結果句），沒有自己的 state。
 * 拆出來是因為 usePlayMapFilters 已經 767 行、逼近 800 行上限，
 * 而且「篩選狀態機」與「怎麼把結果排版」本來就是兩件事。
 */
export type UsePlayMapBrowseModelOptions = {
  filtered: readonly Playground[];
  /** 已套用其他篩選、未套用 city 本身的各縣市命中數。 */
  cityCounts: ReadonlyMap<string, number>;
  city: string | null;
  userLatLng: LatLng | null;
  viewportSearchActive: boolean;
  freeOnly: boolean;
  indoorOnly: boolean;
  outdoorOnly: boolean;
  rainyDayOnly: boolean;
  parkingOnly: boolean;
  strollerFriendlyOnly: boolean;
  highEnergyOnly: boolean;
  typeFilter: PlaygroundType | null;
};

export type PlayMapBrowseModel = {
  /** 「在哪裡玩？」的北中南分組，只含已收錄縣市。 */
  regions: readonly PlayMapRegion[];
  uncataloguedCities: readonly string[];
  groupMode: PlayMapGroupMode;
  groups: readonly PlayMapResultGroup[];
  /** 只有車程分組要掛免責；其他分組為 null。 */
  groupNote: string | null;
  resultSentence: PlayMapResultSentenceView;
};

export function usePlayMapBrowseModel(
  options: UsePlayMapBrowseModelOptions,
): PlayMapBrowseModel {
  const {
    filtered,
    cityCounts,
    city,
    userLatLng,
    viewportSearchActive,
    freeOnly,
    indoorOnly,
    outdoorOnly,
    rainyDayOnly,
    parkingOnly,
    strollerFriendlyOnly,
    highEnergyOnly,
    typeFilter,
  } = options;

  const regions = useMemo(
    () => buildPlayMapRegions({ counts: cityCounts }),
    [cityCounts],
  );

  const uncataloguedCities = useMemo(() => listUncataloguedCities(), []);

  const groupMode = resolvePlayMapGroupMode({
    hasLocation: userLatLng !== null,
    city,
  });

  const groups = useMemo(
    () =>
      groupPlayMapResults({
        places: filtered,
        mode: groupMode,
        userLatLng,
      }),
    [filtered, groupMode, userLatLng],
  );

  const resultSentence = useMemo(
    () =>
      playMapResultSentence({
        count: filtered.length,
        city,
        nearbyActive: userLatLng !== null,
        viewportSearchActive,
        freeOnly,
        indoorOnly,
        outdoorOnly,
        rainyDayOnly,
        parkingOnly,
        strollerFriendlyOnly,
        highEnergyOnly,
        type: typeFilter,
      }),
    [
      city,
      filtered.length,
      freeOnly,
      highEnergyOnly,
      indoorOnly,
      outdoorOnly,
      parkingOnly,
      rainyDayOnly,
      strollerFriendlyOnly,
      typeFilter,
      userLatLng,
      viewportSearchActive,
    ],
  );

  return {
    regions,
    uncataloguedCities,
    groupMode,
    groups,
    groupNote: groupMode === "drive" && userLatLng ? DRIVE_GROUP_NOTE : null,
    resultSentence,
  };
}
