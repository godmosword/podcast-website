"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  listCities,
  listPlaygrounds,
  PLAYGROUND_TYPES,
  type PlaygroundType,
} from "@/data/playgrounds";
import {
  formatPlaceDistanceLabel,
  sortPlaygrounds,
  type LatLng,
} from "@/lib/playground-distance";
import {
  clusterPlaygroundsByCity,
  isNationwideUnscoped,
} from "@/lib/playground-clusters";
import {
  buildPlayMapQueryString,
  countByCity,
  countByType,
  filterPlaygrounds,
  type PlayMapQuery,
} from "@/lib/playgrounds-query";
import {
  coverageHeadline,
  DEFAULT_PLAY_MAP_CENTER,
  listCityCoverage,
} from "@/lib/playground-coverage";
import {
  SPLIT_MIN_WIDTH_PX,
  VIEW_TABS,
  VISIBLE_STEP,
  type BrowseView,
  type GeoStatus,
  type SelectSource,
  type SheetVariant,
} from "./PlayMapContract";

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduce;
}

function useMinWidth(px: number): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${px}px)`);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [px]);

  return matches;
}

function cityLabel(city: string | null): string {
  return city ?? "全部";
}

function buildFilterSummaryParts(
  city: string | null,
  typeFilter: PlaygroundType | null,
  indoorOnly: boolean,
  freeOnly: boolean,
): string[] {
  const parts = [cityLabel(city)];
  if (typeFilter) parts.push(typeFilter);
  if (indoorOnly) parts.push("室內");
  if (freeOnly) parts.push("免費");
  return parts;
}

export type UsePlayMapFiltersOptions = {
  initialCity: string | null;
  initialType: PlaygroundType | null;
  initialIndoorOnly: boolean;
  initialFreeOnly: boolean;
  initialView: BrowseView;
};

/**
 * play-map 的全部狀態、衍生資料與 handlers。
 *
 * 子元件一律純 render；hooks 只存在於此，避免拆檔後 rerender 邊界改變。
 */
export function usePlayMapFilters({
  initialCity,
  initialType,
  initialIndoorOnly,
  initialFreeOnly,
  initialView,
}: UsePlayMapFiltersOptions) {
  const cities = useMemo(() => listCities(), []);
  const coverage = useMemo(() => listCityCoverage(), []);
  const allPlaces = useMemo(() => listPlaygrounds(), []);
  const reduceMotion = usePrefersReducedMotion();
  const splitLayout = useMinWidth(SPLIT_MIN_WIDTH_PX);

  /*
   * 年齡在 toolbar 講一次（卡片層已移除重複標籤）。
   * 依實際資料推導而非寫死：資料一旦偏斜，寫死的文案就會系統性說謊。
   */
  const ageHeadline = useMemo(() => {
    if (allPlaces.length === 0) return null;
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const place of allPlaces) {
      low = Math.min(low, place.ageRange[0]);
      high = Math.max(high, place.ageRange[1]);
    }
    return `適合 ${low}–${high} 歲`;
  }, [allPlaces]);
  const router = useRouter();
  const pathname = usePathname();

  const [city, setCity] = useState<string | null>(initialCity);
  const [typeFilter, setTypeFilter] = useState<PlaygroundType | null>(
    initialType,
  );
  const [indoorOnly, setIndoorOnly] = useState(initialIndoorOnly);
  const [freeOnly, setFreeOnly] = useState(initialFreeOnly);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [browseView, setBrowseView] = useState<BrowseView>(initialView);
  const [sheetVariant, setSheetVariant] = useState<SheetVariant>("full");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userLatLng, setUserLatLng] = useState<LatLng | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);

  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const cityScrollerRef = useRef<HTMLDivElement>(null);
  const cardListTopRef = useRef<HTMLDivElement>(null);
  const userClosedSheetRef = useRef(false);

  /*
   * 類型／條件面板預設收摺（含桌機）。縣市也進同一塊篩選面板，
   * 不再用 CSS 在 ≥640 常駐——避免首屏被篩選佔滿。
   */

  const filtered = useMemo(() => {
    const raw = filterPlaygrounds({
      city: city ?? undefined,
      indoorOnly,
      freeOnly,
      type: typeFilter ?? undefined,
    });
    return sortPlaygrounds(raw, userLatLng);
  }, [city, indoorOnly, freeOnly, typeFilter, userLatLng]);

  const matchedIds = useMemo(
    () => new Set(filtered.map((place) => place.id)),
    [filtered],
  );

  const unmatchedPlaces = useMemo(
    () => allPlaces.filter((place) => !matchedIds.has(place.id)),
    [allPlaces, matchedIds],
  );

  /** 目前縣市＋進階開關下，各類型還剩幾筆。 */
  const typeCounts = useMemo(
    () =>
      countByType({
        city: city ?? undefined,
        indoorOnly,
        freeOnly,
      }),
    [city, indoorOnly, freeOnly],
  );

  const points = useMemo(
    (): Array<[number, number]> =>
      filtered.map((place) => [place.lat, place.lng]),
    [filtered],
  );

  const selected = selectedId
    ? (filtered.find((place) => place.id === selectedId) ?? null)
    : null;

  const cityCounts = useMemo(
    () =>
      countByCity({
        indoorOnly,
        freeOnly,
        type: typeFilter ?? undefined,
      }),
    [indoorOnly, freeOnly, typeFilter],
  );

  const allCityCount = useMemo(
    () => [...cityCounts.values()].reduce((sum, n) => sum + n, 0),
    [cityCounts],
  );

  const cityPlaces = useMemo(
    () => filterPlaygrounds({ city: city ?? undefined }),
    [city],
  );

  const cityCenter = useMemo((): [number, number] => {
    const first = cityPlaces[0] ?? filtered[0];
    if (first) return [first.lat, first.lng];
    return DEFAULT_PLAY_MAP_CENTER;
  }, [cityPlaces, filtered]);

  const hasExtraFilters = typeFilter !== null || indoorOnly || freeOnly;

  const filterSummaryParts = buildFilterSummaryParts(
    city,
    typeFilter,
    indoorOnly,
    freeOnly,
  );

  const filterSummaryLabel =
    filtered.length === 0
      ? `${filterSummaryParts.join(" · ")} → 0 個地點`
      : `${filterSummaryParts.join(" · ")} → ${filtered.length} 個地點`;

  const syncUrl = useCallback(
    (next: Partial<PlayMapQuery>) => {
      const qs = buildPlayMapQueryString({
        city,
        type: typeFilter,
        indoorOnly,
        freeOnly,
        view: browseView,
        ...next,
      });
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [city, typeFilter, indoorOnly, freeOnly, browseView, pathname, router],
  );

  const handleSelectCity = useCallback(
    (nextCity: string | null) => {
      setCity(nextCity);
      syncUrl({ city: nextCity });
    },
    [syncUrl],
  );

  const handleSelectType = useCallback(
    (nextType: PlaygroundType | null) => {
      setTypeFilter(nextType);
      syncUrl({ type: nextType });
    },
    [syncUrl],
  );

  const handleToggleIndoor = useCallback(() => {
    const next = !indoorOnly;
    setIndoorOnly(next);
    syncUrl({ indoorOnly: next });
  }, [indoorOnly, syncUrl]);

  const handleToggleFree = useCallback(() => {
    const next = !freeOnly;
    setFreeOnly(next);
    syncUrl({ freeOnly: next });
  }, [freeOnly, syncUrl]);

  const handleNearMe = useCallback(() => {
    if (userLatLng) {
      setUserLatLng(null);
      setGeoStatus("idle");
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLatLng({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoStatus("ready");
      },
      () => {
        setUserLatLng(null);
        setGeoStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [userLatLng]);

  const handleSelectView = useCallback(
    (next: BrowseView) => {
      setBrowseView(next);
      syncUrl({ view: next });
    },
    [syncUrl],
  );

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const index = VIEW_TABS.findIndex((tab) => tab.view === browseView);
      let nextIndex: number | null = null;

      if (event.key === "ArrowRight") nextIndex = (index + 1) % VIEW_TABS.length;
      else if (event.key === "ArrowLeft")
        nextIndex = (index - 1 + VIEW_TABS.length) % VIEW_TABS.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = VIEW_TABS.length - 1;
      if (nextIndex === null) return;

      event.preventDefault();
      const nextTab = VIEW_TABS[nextIndex];
      handleSelectView(nextTab.view);
      event.currentTarget
        .querySelector<HTMLButtonElement>(`[data-view-tab="${nextTab.view}"]`)
        ?.focus();
    },
    [browseView, handleSelectView],
  );

  const handleClearFilters = useCallback(() => {
    setTypeFilter(null);
    setIndoorOnly(false);
    setFreeOnly(false);
    syncUrl({ type: null, indoorOnly: false, freeOnly: false });
  }, [syncUrl]);

  const handleSelect = useCallback(
    (id: string, trigger: HTMLElement, source: SelectSource) => {
      lastTriggerRef.current = trigger;
      setSelectedId(id);
      setSheetVariant(source === "map" ? "compact" : "full");
    },
    [],
  );

  const handleSelectFromCard = useCallback(
    (id: string, trigger: HTMLElement) => {
      handleSelect(id, trigger, "card");
    },
    [handleSelect],
  );

  const handleSelectFromMap = useCallback(
    (id: string, trigger: HTMLElement) => {
      handleSelect(id, trigger, "map");
    },
    [handleSelect],
  );

  const handleShowOnMap = useCallback(
    (id: string, trigger: HTMLElement) => {
      lastTriggerRef.current = trigger;
      const place = allPlaces.find((item) => item.id === id);
      const nextCity = city === null && place ? place.city : city;
      if (nextCity !== city) {
        setCity(nextCity);
      }
      setSelectedId(id);
      setSheetVariant("compact");
      if (!splitLayout) {
        setBrowseView("map");
        syncUrl({ city: nextCity, view: "map" });
        return;
      }
      if (nextCity !== city) {
        syncUrl({ city: nextCity });
      }
    },
    [allPlaces, city, splitLayout, syncUrl],
  );

  const handleCloseSheet = useCallback(() => {
    userClosedSheetRef.current = true;
    setSelectedId(null);
  }, []);

  const handleExpandSheet = useCallback(() => {
    setSheetVariant("full");
  }, []);

  const handleToggleFilters = useCallback(() => {
    setFiltersOpen((open) => !open);
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((n) => n + VISIBLE_STEP);
  }, []);

  /*
   * 篩選條件變更＝新查詢，批次歸零。
   * 定位授權造成的重排**不**歸零（保留使用者已展開的筆數），
   * 但需捲回列表頂端並播報，否則盯著中段卡片的人會看到內容整批突變。
   */
  useEffect(() => {
    setVisibleCount(VISIBLE_STEP);
  }, [city, typeFilter, indoorOnly, freeOnly]);

  /*
   * 定位授權成功會讓整批卡片重排（前 N 筆整批換人）。
   * 保留 visibleCount，但必須捲回列表頂端，否則盯著中段的人會看到內容突變。
   */
  useEffect(() => {
    if (!userLatLng) return;
    cardListTopRef.current?.scrollIntoView({ block: "start" });
  }, [userLatLng]);

  useEffect(() => {
    if (selectedId && !filtered.some((place) => place.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (selected) return;
    if (!userClosedSheetRef.current) return;
    lastTriggerRef.current?.focus();
    userClosedSheetRef.current = false;
  }, [selected]);

  useEffect(() => {
    setCity(initialCity);
  }, [initialCity]);

  useEffect(() => {
    setTypeFilter(initialType);
  }, [initialType]);

  useEffect(() => {
    setIndoorOnly(initialIndoorOnly);
  }, [initialIndoorOnly]);

  useEffect(() => {
    setFreeOnly(initialFreeOnly);
  }, [initialFreeOnly]);

  useEffect(() => {
    setBrowseView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (city === null) return;
    const chip = cityScrollerRef.current?.querySelector<HTMLElement>(
      `[data-city-chip="${city}"]`,
    );
    chip?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [city]);

  const shownCount = Math.min(visibleCount, filtered.length);
  const canLoadMore = shownCount < filtered.length;
  const visibleCountLabel = `已顯示 ${shownCount}／${filtered.length} 處`;

  const visibleTypeOptions = PLAYGROUND_TYPES.filter((item) => {
    const count = typeCounts.get(item) ?? 0;
    return count > 0 || typeFilter === item;
  });

  const clusterMode = isNationwideUnscoped(city, userLatLng !== null);
  const cityClusters = useMemo(
    () => clusterPlaygroundsByCity(filtered),
    [filtered],
  );
  const showCards = splitLayout || browseView === "cards";
  const showMap = splitLayout || browseView === "map";
  const selectedDistanceLabel = selected
    ? formatPlaceDistanceLabel(selected, userLatLng)
    : null;

  return {
    cities,
    coverageLabel: [ageHeadline, coverageHeadline(coverage)]
      .filter(Boolean)
      .join(" · "),
    reduceMotion,
    splitLayout,
    clusterMode,
    cityClusters,
    showCards,
    showMap,
    selectedDistanceLabel,
    city,
    typeFilter,
    indoorOnly,
    freeOnly,
    selectedId,
    browseView,
    sheetVariant,
    filtersOpen,
    userLatLng,
    geoStatus,
    sheetRef,
    cityScrollerRef,
    cardListTopRef,
    filtered,
    unmatchedPlaces,
    typeCounts,
    points,
    selected,
    cityCounts,
    allCityCount,
    cityCenter,
    hasExtraFilters,
    filterSummaryLabel,
    visibleCount,
    canLoadMore,
    visibleCountLabel,
    handleLoadMore,
    visibleTypeOptions,
    handleSelectCity,
    handleSelectType,
    handleToggleIndoor,
    handleToggleFree,
    handleNearMe,
    handleSelectView,
    handleTabKeyDown,
    handleClearFilters,
    handleSelectFromCard,
    handleSelectFromMap,
    handleShowOnMap,
    handleCloseSheet,
    handleExpandSheet,
    handleToggleFilters,
  };
}
