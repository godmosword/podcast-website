/**
 * play-map 子元件的凍結介面（Approved Plan T1）。
 *
 * 拆檔前先固定這份 contract，之後的 T3／T4／T5 才有辦法分辨
 * 「diff 來自拆檔」還是「diff 來自功能變更」。改這裡等同改契約，
 * 需回到 Plan 重新過審。
 */
import type { RefObject } from "react";
import type { Playground, PlaygroundType } from "@/data/playgrounds";
import type { LatLng } from "@/lib/playground-distance";
import type { PlayMapCityTile } from "@/lib/play-map-city-tiles";
import type { PlayMapResultSentenceView } from "@/lib/play-map-copy";
import type { PlayMapResultGroup } from "@/lib/play-map-groups";
import type { PlayMapView } from "@/lib/playgrounds-query";

export type BrowseView = PlayMapView;
export type SheetVariant = "compact" | "full";
export type EnvironmentFilter = "all" | "indoor" | "outdoor";
export type SelectSource = "card" | "map";
export type GeoStatus = "idle" | "pending" | "ready" | "denied";

export const SHEET_BG_HINT_ID = "play-map-sheet-bg-hint";

/**
 * 每批可見卡片數。**只遮蔽、不裁切陣列**——99 筆恆在 DOM。
 * slice 會把未顯示的卡連同其導航連結一起移出 DOM，破壞 SSR 索引契約與導航紅線。
 */
export const VISIBLE_STEP = 24;

/**
 * 「附近」未選縣市時，鏡頭只框使用者位置＋距離最近的這幾筆。
 * 地圖針仍畫篩選全集，避免 99 根針把 fitBounds 拉成全台。
 */
export const NEAR_ME_FIT_COUNT = 8;

/**
 * 桌面並排名單＋地圖（對齊全站 980 導覽斷點）。
 * v2 起**僅在 view=map 生效**：view=cards 是縣市磚牆滿版，任何寬度都不掛 Leaflet。
 */
export const SPLIT_MIN_WIDTH_PX = 980;

export const CARDS_PANEL_ID = "play-map-panel-cards";
export const MAP_PANEL_ID = "play-map-panel-map";
/** 手機「看地圖」；離開地圖模式時把 focus 還給這個鈕。 */
export const OPEN_MAP_BUTTON_ID = "play-map-open-map";

/**
 * 縣市磚牆。22 縣市中僅 15 個有資料，其餘必須顯性標示「未收錄」——
 * 把「這組條件 0 筆」與「整個縣市沒收錄」混成同一種灰色會誤導家長。
 */
export type PlayMapCityWallProps = {
  tiles: readonly PlayMapCityTile[];
  selectedCity: string | null;
  /** 點同一塊磚兩次＝取消，呼叫端負責傳 null。 */
  onToggleCity: (next: string | null) => void;
  /** 尚未收錄的縣市名，用於磚牆下方的**可見**誠實聲明，不得只放進 aria-label。 */
  uncataloguedCities: readonly string[];
};

export type PlayMapToolbarProps = {
  /** 手機地圖模式隱藏頁首裝飾，把畫面讓給地圖。 */
  compact?: boolean;
};

export type PlayMapControlBarProps = {
  nearMeActive: boolean;
  geoStatus: GeoStatus;
  freeOnly: boolean;
  indoorOnly: boolean;
  outdoorOnly: boolean;
  rainyDayOnly: boolean;
  parkingOnly: boolean;
  strollerFriendlyOnly: boolean;
  highEnergyOnly: boolean;
  /** 顯示目前有幾個進階條件已套用；附近不算進階篩選。 */
  activeFilterCount: number;
  onNearMe: () => void;
  onToggleFree: () => void;
  onToggleIndoor: () => void;
  onSelectEnvironment: (next: EnvironmentFilter) => void;
  onToggleRainyDay: () => void;
  onToggleParking: () => void;
  onToggleStrollerFriendly: () => void;
  onToggleHighEnergy: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  cities: readonly string[];
  city: string | null;
  cityCounts: ReadonlyMap<string, number>;
  allCityCount: number;
  onSelectCity: (next: string | null) => void;
  cityScrollerRef: RefObject<HTMLDivElement | null>;
  typeFilter: PlaygroundType | null;
  typeCounts: ReadonlyMap<PlaygroundType, number>;
  visibleTypeOptions: readonly PlaygroundType[];
  onSelectType: (next: PlaygroundType | null) => void;
};

export type PlayMapCardProps = {
  place: Playground;
  variant?: "default" | "mapSheet";
  selected: boolean;
  hovered: boolean;
  hoverCorrelationEnabled: boolean;
  hidden: boolean;
  distanceLabel: string | null;
  onHover: (id: string) => void;
  onBlur: (id: string) => void;
  onSelect: (id: string, trigger: HTMLElement) => void;
  registerCardRef: (id: string, element: HTMLLIElement | null) => void;
};

export type PlayMapCardListProps = {
  /** 已分組的命中結果；渲染順序即 displayIndex 順序。 */
  groups: readonly PlayMapResultGroup[];
  /** 命中總數。「一組都沒有」與「全部被批次遮住」是兩件事，必須分辨。 */
  matchedCount: number;
  unmatched: readonly Playground[];
  selectedId: string | null;
  hoveredPlaceId: string | null;
  hoverCorrelationEnabled: boolean;
  userLatLng: LatLng | null;
  hasExtraFilters: boolean;
  onClearFilters: () => void;
  viewportSearchActive: boolean;
  onClearViewportSearch: () => void;
  onHover: (id: string) => void;
  onBlur: (id: string) => void;
  onSelect: (id: string, trigger: HTMLElement) => void;
  registerCardRef: (id: string, element: HTMLLIElement | null) => void;
  resultSentence: PlayMapResultSentenceView;
  /** 車程分組時的粗估免責文字；其他分組為 null。 */
  groupNote: string | null;
  /** 手機名單模式顯示「看地圖」；桌面並排不需要。 */
  showMapAction: boolean;
  onOpenMap: () => void;
  /** 低於主要結果摘要顯示的 coverage/editorial 狀態。 */
  coverageLabel: string;
  editorialPick: {
    place: Playground;
    reason: string;
  } | null;
  /** 本批可見筆數；以 displayIndex 判定，超出者收 hidden，**不得** slice 陣列。 */
  visibleCount: number;
  /** 相對於「篩選後命中數」而非全站 99，否則會出現無效按鈕。 */
  canLoadMore: boolean;
  visibleCountLabel: string;
  onLoadMore: () => void;
  /** 定位重排後捲回此錨點（見 usePlayMapFilters 的 userLatLng effect）。 */
  topRef: RefObject<HTMLDivElement | null>;
};

export type PlayMapSheetProps = {
  place: Playground;
  variant: SheetVariant;
  distanceLabel: string | null;
  onClose: () => void;
  onExpand: () => void;
  onShowOnMap: (id: string, trigger: HTMLElement) => void;
  panelRef: RefObject<HTMLDivElement | null>;
};
