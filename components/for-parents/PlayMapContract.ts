/**
 * play-map 子元件的凍結介面（Approved Plan T1）。
 *
 * 拆檔前先固定這份 contract，之後的 T3／T4／T5 才有辦法分辨
 * 「diff 來自拆檔」還是「diff 來自功能變更」。改這裡等同改契約，
 * 需回到 Plan 重新過審。
 */
import type { KeyboardEvent, RefObject } from "react";
import type { Playground, PlaygroundType } from "@/data/playgrounds";
import type { LatLng } from "@/lib/playground-distance";
import type { PlayMapView } from "@/lib/playgrounds-query";

export type BrowseView = PlayMapView;
export type SheetVariant = "compact" | "full";
export type SelectSource = "card" | "map";
export type GeoStatus = "idle" | "pending" | "ready" | "denied";

export const SHEET_BG_HINT_ID = "play-map-sheet-bg-hint";

/**
 * 每批可見卡片數。**只遮蔽、不裁切陣列**——73 筆恆在 DOM。
 * slice 會把未顯示的卡連同其導航連結一起移出 DOM，破壞 SSR 索引契約與導航紅線。
 */
export const VISIBLE_STEP = 24;

/**
 * 「離我最近」未選縣市時，鏡頭只框使用者位置＋距離最近的這幾筆。
 * 地圖針仍畫篩選全集，避免 73 根針把 fitBounds 拉成全台。
 */
export const NEAR_ME_FIT_COUNT = 8;

/** 桌面並排名單＋地圖（對齊全站 980 導覽斷點）。 */
export const SPLIT_MIN_WIDTH_PX = 980;

export const VIEW_TABS: readonly {
  view: BrowseView;
  label: string;
  id: string;
  panelId: string;
}[] = [
  {
    view: "cards",
    label: "卡片",
    id: "play-map-tab-cards",
    panelId: "play-map-panel-cards",
  },
  {
    view: "map",
    label: "地圖",
    id: "play-map-tab-map",
    panelId: "play-map-panel-map",
  },
];

export type PlayMapToolbarProps = {
  howToStart: string;
  coverageLabel: string;
  browseView: BrowseView;
  onSelectView: (next: BrowseView) => void;
  onTabKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** 桌面並排時隱藏互斥分頁，避免與雙欄重複。 */
  hideViewTabs?: boolean;
};

export type PlayMapControlBarProps = {
  nearMeActive: boolean;
  geoStatus: GeoStatus;
  freeOnly: boolean;
  indoorOnly: boolean;
  onNearMe: () => void;
  onToggleFree: () => void;
  onToggleIndoor: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  filterSummaryLabel: string;
  canClearFilters: boolean;
  onClearFilters: () => void;
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
  selected: boolean;
  hidden: boolean;
  distanceLabel: string | null;
  onSelect: (id: string, trigger: HTMLElement) => void;
};

export type PlayMapCardListProps = {
  matched: readonly Playground[];
  unmatched: readonly Playground[];
  selectedId: string | null;
  userLatLng: LatLng | null;
  hasExtraFilters: boolean;
  onClearFilters: () => void;
  onSelect: (id: string, trigger: HTMLElement) => void;
  /** 未選縣市且未定位時，提示先縮小範圍。 */
  showScopeHint: boolean;
  /** 本批可見筆數；超出者收 hidden，**不得** slice 陣列。 */
  visibleCount: number;
  /** 相對於「篩選後命中數」而非全站 73，否則會出現無效按鈕。 */
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
