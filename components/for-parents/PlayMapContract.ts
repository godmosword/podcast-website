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
 *
 * 2026-10-19 情境先行改版（Plan：play-map-scenarios v2，已過工程／對抗／設計審）：
 * 新增 ScenarioGrid（四張情境卡）與 LocationBar（在 全台 ▾ 或 我附近＋更多條件），
 * LocationPicker 改成 dialog，ControlBar 只剩「更多條件」面板內容。
 */
import type { ReactNode, RefObject } from "react";
import type { Playground, PlaygroundType } from "@/data/playgrounds";
import type { LatLng } from "@/lib/playground-distance";
import type { PlayMapResultSentenceView } from "@/lib/play-map-copy";
import type { PlayMapResultGroup } from "@/lib/play-map-groups";
import type { PlayMapRegion } from "@/lib/play-map-regions";
import type { PlayMapScenarioId } from "@/lib/play-map-scenarios";
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
/** 「更多條件」面板（位置列的開關鈕 aria-controls 指向它）。 */
export const FILTER_PANEL_ID = "play-map-filter-panel";
/** 選縣市面板（dialog）。 */
export const LOCATION_DIALOG_ID = "play-map-location-dialog";

/** 情境卡一張的檢視模型。 */
export type PlayMapScenarioCardView = {
  id: PlayMapScenarioId;
  label: string;
  /** e2e 契約：rain／energy／museum／free。 */
  quickFilter: string;
  /** 選了這張之後的結果數。 */
  count: number;
  pressed: boolean;
};

export type PlayMapScenarioGridProps = {
  /** 桌面地圖並排時縮成一列小鈕（不畫插畫），把高度讓給地圖。 */
  compact?: boolean;
  scenarios: readonly PlayMapScenarioCardView[];
  /** 數量前面的範圍字：「全台」「台北市」「你附近」。 */
  scopeLabel: string;
  onSelect: (id: PlayMapScenarioId) => void;
};

/** 「在［全台 ▾］或［我附近］」＋「更多條件」；捲過之後黏在上方並列出目前情境。 */
export type PlayMapLocationBarProps = {
  /** 觸發鈕上的字：「全台」或縣市名。 */
  locationLabel: string;
  locationTriggerRef: RefObject<HTMLButtonElement | null>;
  onOpenLocation: () => void;
  locationOpen: boolean;
  nearMeActive: boolean;
  geoStatus: GeoStatus;
  onNearMe: () => void;
  /** 「更多條件」徽章：類型（看展覽情境自己的博物館不算）、室內外、好停車、推車 OK。 */
  panelFilterCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  /** 黏住時顯示的目前情境；沒有單一情境時為 null。 */
  activeScenarioLabel: string | null;
  onClearActiveScenario: () => void;
  /** 「更多條件」面板；放在黏住的容器裡，展開時跟著位置列一起黏著。 */
  children?: ReactNode;
};

/**
 * 選縣市面板（dialog）：我附近、全台、北中南分組縣市、未收錄說明。
 * 22 縣市中僅 15 個有資料；未收錄縣市不做成按鈕，改用一行可見文字說明——
 * 把「這組條件 0 筆」（empty，仍可點）與「整個縣市沒收錄」混在一起會誤導家長。
 */
export type PlayMapLocationPickerProps = {
  open: boolean;
  onClose: () => void;
  /** 關閉後焦點還給它；它不在畫面上時退回位置列。 */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  /** 只含已收錄縣市；count＝目前情境＋更多條件在該縣市的筆數（不套縣市本身）。 */
  regions: readonly PlayMapRegion[];
  /** 「全台」那顆的數字。 */
  allCount: number;
  selectedCity: string | null;
  /** 選一個縣市或 null（全台）；選完由呼叫端關閉面板。 */
  onSelectCity: (next: string | null) => void;
  /** 尚未收錄的縣市名，用於面板下方的**可見**誠實聲明，不得只放進 aria-label。 */
  uncataloguedCities: readonly string[];
  /** 面板副標：「數字是『下雨也能玩』的地方數」；沒有情境時為 null。 */
  scenarioLabel: string | null;
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

/** 「更多條件」面板：類型、好停車、推車 OK、室內／戶外（互斥）。 */
export type PlayMapControlBarProps = {
  indoorOnly: boolean;
  outdoorOnly: boolean;
  parkingOnly: boolean;
  strollerFriendlyOnly: boolean;
  onSelectEnvironment: (next: EnvironmentFilter) => void;
  onToggleParking: () => void;
  onToggleStrollerFriendly: () => void;
  filtersOpen: boolean;
  typeFilter: PlaygroundType | null;
  typeCounts: ReadonlyMap<PlaygroundType, number>;
  visibleTypeOptions: readonly PlaygroundType[];
  onSelectType: (next: PlaygroundType | null) => void;
};

export type PlayMapCardProps = {
  place: Playground;
  /** 「為什麼適合目前情境」：資料原詞組成；沒有情境或沒命中為 null。 */
  reason: string | null;
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
  /** 目前唯一的情境（決定結果句與卡片理由行）；沒有或多個時為 null。 */
  activeScenario: PlayMapScenarioId | null;
  /** 網址同時帶多個情境參數時，逐項列出的可見條件（各自可取消）。 */
  extraScenarioChips: readonly { id: PlayMapScenarioId; label: string }[];
  onClearScenario: (id: PlayMapScenarioId) => void;
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
