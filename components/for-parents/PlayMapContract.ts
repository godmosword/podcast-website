/**
 * play-map 子元件的凍結介面（Approved Plan T1）。
 *
 * 拆檔前先固定這份 contract，之後的 T3／T4／T5 才有辦法分辨
 * 「diff 來自拆檔」還是「diff 來自功能變更」。改這裡等同改契約，
 * 需回到 Plan 重新過審。
 *
 * 2026-10-18 簡化改版（Plan：play-map-simplify v2，已過工程／設計審）：
 * 縣市磚牆換成 LocationPicker（北中南分組＋「我附近」），
 * ControlBar 只剩條件，徽章改數面板內條件。
 */
import type { RefObject } from "react";
import type { Playground, PlaygroundType } from "@/data/playgrounds";
import type { LatLng } from "@/lib/playground-distance";
import type { PlayMapResultSentenceView } from "@/lib/play-map-copy";
import type { PlayMapResultGroup } from "@/lib/play-map-groups";
import type { PlayMapRegion } from "@/lib/play-map-regions";
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
 * v2 起**僅在 view=map 生效**：view=cards 是位置選擇器＋名單，任何寬度都不掛 Leaflet。
 */
export const SPLIT_MIN_WIDTH_PX = 980;

export const CARDS_PANEL_ID = "play-map-panel-cards";
export const MAP_PANEL_ID = "play-map-panel-map";
/** 手機「看地圖」；離開地圖模式時把 focus 還給這個鈕。 */
export const OPEN_MAP_BUTTON_ID = "play-map-open-map";

/**
 * 「在哪裡玩？」位置選擇器：北中南分組縣市＋「我附近」。
 * 22 縣市中僅 15 個有資料；未收錄縣市不做成按鈕，改用一行可見文字說明——
 * 把「這組條件 0 筆」（empty，仍可點）與「整個縣市沒收錄」混在一起會誤導家長。
 */
export type PlayMapLocationPickerProps = {
  /** "row"：桌面地圖並排時北中南橫排，讓地圖留在首屏；預設 "stack"。 */
  layout?: "stack" | "row";
  /** 只含已收錄縣市；count 為套用其他條件、不套用縣市本身的命中數。 */
  regions: readonly PlayMapRegion[];
  selectedCity: string | null;
  /** 點同一個縣市兩次＝取消，呼叫端負責傳 null。 */
  onToggleCity: (next: string | null) => void;
  /** 尚未收錄的縣市名，用於選擇器下方的**可見**誠實聲明，不得只放進 aria-label。 */
  uncataloguedCities: readonly string[];
  nearMeActive: boolean;
  geoStatus: GeoStatus;
  onNearMe: () => void;
};

export type PlayMapToolbarProps = {
  /** 手機地圖模式隱藏頁首摘要，把畫面讓給地圖。 */
  compact?: boolean;
  /** H1 下的收錄摘要（年齡定位＋收錄縣市與筆數），取代原本的頁尾小字。 */
  coverageLabel: string;
};

export type PlayMapControlBarProps = {
  freeOnly: boolean;
  indoorOnly: boolean;
  outdoorOnly: boolean;
  rainyDayOnly: boolean;
  parkingOnly: boolean;
  strollerFriendlyOnly: boolean;
  highEnergyOnly: boolean;
  /**
   * 「篩選」徽章：只數面板裡的條件（類型、好停車、推車 OK、戶外）。
   * 快捷列看得到的條件與位置（縣市／附近）都不算，避免同一件事被數兩次。
   */
  panelFilterCount: number;
  onToggleFree: () => void;
  onSelectEnvironment: (next: EnvironmentFilter) => void;
  onToggleRainyDay: () => void;
  onToggleParking: () => void;
  onToggleStrollerFriendly: () => void;
  onToggleHighEnergy: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  typeFilter: PlaygroundType | null;
  typeCounts: ReadonlyMap<PlaygroundType, number>;
  visibleTypeOptions: readonly PlaygroundType[];
  onSelectType: (next: PlaygroundType | null) => void;
};

export type PlayMapCardProps = {
  place: Playground;
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
  /** 手機名單模式：已選縣市或已定位時顯示「看地圖」；桌面並排不需要。 */
  showMapAction: boolean;
  onOpenMap: () => void;
  editorialPick: {
    place: Playground;
    reason: string;
  } | null;
  /** 本批可見筆數；以 displayIndex 判定，超出者收 hidden，**不得** slice 陣列。 */
  visibleCount: number;
  /** 相對於「篩選後命中數」而非全站 99，否則會出現無效按鈕。 */
  canLoadMore: boolean;
  /** 「已看 24／99」 */
  visibleCountLabel: string;
  /** 「再看 24 個」：下一批實際會多出的筆數。 */
  loadMoreLabel: string;
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
