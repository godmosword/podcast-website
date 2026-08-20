// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  clusterPlaygroundsByCity,
  clusterPlaygroundsByZoom,
} from "@/lib/playground-clusters";
import { DEFAULT_PLAY_MAP_CENTER } from "@/lib/playground-coverage";
import { nationalViewForClusters } from "@/lib/play-map-camera";
import { playgroundTypeGlyphSvg } from "@/lib/playground-type-glyph";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import PlayMapLeaflet, { playMapFitKey } from "./PlayMapLeaflet";
import type { PlayMapLeafletProps } from "./PlayMapLeaflet";
import { NEAR_ME_FIT_COUNT } from "./PlayMapContract";

vi.stubGlobal("React", React);

vi.mock("leaflet/dist/leaflet.css", () => ({}));

/*
 * divIcon 原本是 `() => ({})` 的黑洞，等於針的 HTML（aria-label、aria-pressed、
 * 類型剪影）完全沒有測試在守。改成 spy 以便斷言標記內容。
 */
type MarkerSpyProps = {
  position?: unknown;
  zIndexOffset?: number;
  eventHandlers?: Record<string, (event: never) => void>;
};

const { divIconSpy, markerSpy } = vi.hoisted(() => ({
  divIconSpy: vi.fn<(options?: { html?: string }) => object>(() => ({})),
  markerSpy: vi.fn<(props: MarkerSpyProps) => void>(() => {}),
}));

vi.mock("leaflet", () => {
  class LatLngBounds {
    constructor(public points: unknown) {}
  }
  const leaflet = {
    latLngBounds: (points: unknown) => new LatLngBounds(points),
    divIcon: divIconSpy,
  };
  return { default: leaflet, ...leaflet };
});

const fitBounds = vi.fn();
const setView = vi.fn();
const mapOn = vi.fn();
const mapOff = vi.fn();
type MapBoundsStub = {
  contains: (point: unknown) => boolean;
  getSouth: () => number;
  getWest: () => number;
  getNorth: () => number;
  getEast: () => number;
};

const mapStub = {
  fitBounds,
  setView,
  getBounds: vi.fn((): MapBoundsStub => ({
    contains: () => false,
    getSouth: () => 24,
    getWest: () => 120,
    getNorth: () => 26,
    getEast: () => 122,
  })),
  getZoom: vi.fn(() => 11),
  on: mapOn,
  off: mapOff,
  invalidateSize: vi.fn(),
  getSize: vi.fn(() => ({ x: 720, y: 512 })),
};

const mapState: { current: typeof mapStub } = { current: mapStub };

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  Marker: (props: MarkerSpyProps) => {
    markerSpy(props);
    return null;
  },
  TileLayer: () => null,
  ZoomControl: () => null,
  useMap: () => mapState.current,
}));

const samplePlaces = listPlaygrounds().slice(0, 3);

function leafletProps(
  overrides: Partial<PlayMapLeafletProps> = {},
): PlayMapLeafletProps {
  const places = overrides.places ?? samplePlaces;
  return {
    places,
    points: places.map((place) => [place.lat, place.lng]),
    emptyCenter: DEFAULT_PLAY_MAP_CENTER,
    selectedId: null,
    hoveredPlaceId: null,
    hoverCorrelationEnabled: true,
    onHover: vi.fn(),
    onBlur: vi.fn(),
    onSelect: vi.fn(),
    reduceMotion: true,
    active: true,
    clusterMode: false,
    cityClusters: clusterPlaygroundsByCity(places),
    onSelectCity: vi.fn(),
    userLatLng: null,
    viewportZoom: null,
    preserveViewport: false,
    onViewportSettled: vi.fn(),
    resizeRequest: 0,
    splitLayout: true,
    nearMeCamera: false,
    ...overrides,
  };
}

describe("playMapFitKey", () => {
  it("縣市範圍去重排序，不因傳入順序改變", () => {
    expect(
      playMapFitKey({
        clusterMode: false,
        cities: ["桃園市", "台北市", "桃園市"],
        filteredCount: 3,
        selectedId: null,
      }),
    ).toBe(
      playMapFitKey({
        clusterMode: false,
        cities: ["台北市", "桃園市"],
        filteredCount: 3,
        selectedId: null,
      }),
    );
  });

  it("clusterMode、筆數、selectedId、splitLayout 任一改變都會換鍵", () => {
    const base = {
      clusterMode: false,
      cities: ["台北市"],
      filteredCount: 8,
      selectedId: null as string | null,
    };
    expect(playMapFitKey(base)).not.toBe(
      playMapFitKey({ ...base, clusterMode: true }),
    );
    expect(playMapFitKey(base)).not.toBe(
      playMapFitKey({ ...base, filteredCount: 9 }),
    );
    expect(playMapFitKey(base)).not.toBe(
      playMapFitKey({ ...base, selectedId: "tp-children-park" }),
    );
    expect(playMapFitKey(base)).not.toBe(
      playMapFitKey({ ...base, cities: ["新北市"] }),
    );
    expect(playMapFitKey(base)).not.toBe(
      playMapFitKey({ ...base, nearMeToken: "25.040,121.550" }),
    );
    expect(playMapFitKey(base)).not.toBe(
      playMapFitKey({ ...base, splitLayout: true }),
    );
  });
});

describe("PlayMapLeaflet FitBounds", () => {
  beforeEach(() => {
    fitBounds.mockClear();
    setView.mockClear();
    mapStub.invalidateSize.mockClear();
    mapStub.getSize.mockClear();
    mapStub.getSize.mockReturnValue({ x: 720, y: 512 });
    markerSpy.mockClear();
    mapStub.getBounds.mockReset();
    mapStub.getBounds.mockReturnValue({
      contains: () => false,
      getSouth: () => 24,
      getWest: () => 120,
      getNorth: () => 26,
      getEast: () => 122,
    });
    mapStub.getZoom.mockReturnValue(11);
    mapOn.mockClear();
    mapOff.mockClear();
    mapState.current = mapStub;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("fitKey 不變而 parent 重繪時，fitBounds 不再被呼叫", () => {
    const { rerender } = render(<PlayMapLeaflet {...leafletProps()} />);
    expect(fitBounds).toHaveBeenCalledTimes(1);

    rerender(
      <PlayMapLeaflet {...leafletProps({ onSelect: vi.fn() })} />,
    );
    expect(fitBounds).toHaveBeenCalledTimes(1);
  });

  it("全國未縮小範圍用容器感知 setView 框住所有縣市聚合", () => {
    const places = [...listPlaygrounds()];
    render(
      <PlayMapLeaflet
        {...leafletProps({
          places,
          clusterMode: true,
          viewportZoom: 8,
        })}
      />,
    );
    expect(setView).toHaveBeenCalled();
    const last = setView.mock.calls.at(-1);
    const expected = nationalViewForClusters({
      widthPx: 720,
      heightPx: 512,
      points: clusterPlaygroundsByCity(places),
    });
    expect(last?.[0]).toEqual(expected.center);
    expect(last?.[1]).toBe(expected.zoom);
    expect(fitBounds).not.toHaveBeenCalled();
  });

  it("mobile results sheet snap 變更時只要求 Leaflet 重算尺寸", () => {
    const { rerender } = render(
      <PlayMapLeaflet {...leafletProps({ resizeRequest: 0 })} />,
    );
    expect(mapStub.invalidateSize).toHaveBeenCalledTimes(1);

    rerender(
      <PlayMapLeaflet {...leafletProps({ resizeRequest: 1 })} />,
    );
    expect(mapStub.invalidateSize).toHaveBeenCalledTimes(2);
    expect(fitBounds).toHaveBeenCalledTimes(1);
  });

  it("連續多次 parent 重繪且 fitKey 不變時，fitBounds 只呼叫一次", () => {
    const { rerender } = render(<PlayMapLeaflet {...leafletProps()} />);
    expect(fitBounds).toHaveBeenCalledTimes(1);

    rerender(<PlayMapLeaflet {...leafletProps({ onSelect: vi.fn() })} />);
    rerender(<PlayMapLeaflet {...leafletProps({ onSelect: vi.fn() })} />);
    rerender(<PlayMapLeaflet {...leafletProps({ onSelect: vi.fn() })} />);
    expect(fitBounds).toHaveBeenCalledTimes(1);
  });

  it("splitLayout 改變時會重算鏡頭", () => {
    const { rerender } = render(<PlayMapLeaflet {...leafletProps()} />);
    expect(fitBounds).toHaveBeenCalledTimes(1);

    rerender(
      <PlayMapLeaflet {...leafletProps({ splitLayout: false })} />,
    );
    expect(fitBounds).toHaveBeenCalledTimes(2);
  });

  it("fitKey 改變時仍會呼叫", () => {
    const { rerender } = render(<PlayMapLeaflet {...leafletProps()} />);
    expect(fitBounds).toHaveBeenCalledTimes(1);

    rerender(
      <PlayMapLeaflet
        {...leafletProps({ selectedId: samplePlaces[0]?.id ?? "ty-fenghe" })}
      />,
    );
    expect(fitBounds).toHaveBeenCalledTimes(2);

    rerender(
      <PlayMapLeaflet {...leafletProps({ places: samplePlaces.slice(0, 2) })} />,
    );
    expect(fitBounds).toHaveBeenCalledTimes(3);
  });

  it("選中 marker 已在目前 bounds 時不重複移動鏡頭", () => {
    const selected = samplePlaces[0];
    expect(selected).toBeDefined();
    if (!selected) return;

    const { rerender } = render(<PlayMapLeaflet {...leafletProps()} />);
    expect(fitBounds).toHaveBeenCalledTimes(1);
    mapStub.getBounds.mockReturnValue({
      contains: () => true,
      getSouth: () => 24,
      getWest: () => 120,
      getNorth: () => 26,
      getEast: () => 122,
    });

    rerender(<PlayMapLeaflet {...leafletProps({ selectedId: selected.id })} />);
    expect(fitBounds).toHaveBeenCalledTimes(1);
  });

  it("nearMeCamera 鏡頭只框使用者位置＋最近 N 筆", () => {
    const places = listPlaygrounds().slice(0, 20);
    const user = { lat: places[0]?.lat ?? 25, lng: places[0]?.lng ?? 121 };
    render(
      <PlayMapLeaflet
        {...leafletProps({
          places,
          nearMeCamera: true,
          userLatLng: user,
          clusterMode: false,
        })}
      />,
    );
    expect(fitBounds).toHaveBeenCalledTimes(1);
    const boundsArg = fitBounds.mock.calls[0] as unknown as [
      { points: Array<[number, number]> },
    ];
    expect(boundsArg[0].points).toHaveLength(1 + NEAR_ME_FIT_COUNT);
    expect(boundsArg[0].points[0]).toEqual([user.lat, user.lng]);
  });

  it("全台 zoom 由 city aggregate 轉 spatial cluster，再到 individual", () => {
    const places = [
      { ...samplePlaces[0], id: "cluster-a", lat: 25.02, lng: 121.52 },
      { ...samplePlaces[1], id: "cluster-b", lat: 25.04, lng: 121.54 },
      { ...samplePlaces[2], id: "single-c", lat: 24.8, lng: 120.96 },
    ];
    const { rerender } = render(
      <PlayMapLeaflet
        {...leafletProps({ places, clusterMode: true, viewportZoom: 8 })}
      />,
    );
    expect(markerSpy.mock.calls).toHaveLength(
      clusterPlaygroundsByCity(places).length,
    );

    markerSpy.mockClear();
    divIconSpy.mockClear();
    rerender(
      <PlayMapLeaflet
        {...leafletProps({ places, clusterMode: true, viewportZoom: 11 })}
      />,
    );
    expect(
      divIconSpy.mock.calls.some((call) =>
        call[0]?.html?.includes("playMapSpatialClusterButton"),
      ),
    ).toBe(true);

    markerSpy.mockClear();
    rerender(
      <PlayMapLeaflet
        {...leafletProps({ places, clusterMode: true, viewportZoom: 13 })}
      />,
    );
    expect(markerSpy.mock.calls).toHaveLength(places.length);
    expect(clusterPlaygroundsByZoom(places, 11).some((cluster) => cluster.count > 1)).toBe(
      true,
    );
  });

  it("spatial cluster click 只聚焦 contained places，不開 Sheet 或選景點", () => {
    const places = [
      { ...samplePlaces[0], id: "cluster-a", lat: 25.02, lng: 121.52 },
      { ...samplePlaces[1], id: "cluster-b", lat: 25.04, lng: 121.54 },
      { ...samplePlaces[2], id: "single-c", lat: 24.8, lng: 120.96 },
    ];
    const onSelect = vi.fn();
    const onSelectCity = vi.fn();
    render(
      <PlayMapLeaflet
        {...leafletProps({
          places,
          clusterMode: true,
          viewportZoom: 11,
          onSelect,
          onSelectCity,
        })}
      />,
    );
    const clusterMarker = markerSpy.mock.calls.find(([props]) =>
      props.eventHandlers?.click &&
      JSON.stringify(props.position) !== JSON.stringify([places[2]?.lat, places[2]?.lng]),
    )?.[0];
    expect(clusterMarker?.eventHandlers?.click).toBeTypeOf("function");

    clusterMarker?.eventHandlers?.click?.(undefined as never);
    expect(fitBounds).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectCity).not.toHaveBeenCalled();
  });

  it("selected place 在 zoom-out 進入 cluster 後仍不被 Leaflet 清除", () => {
    const places = [
      { ...samplePlaces[0], id: "cluster-a", lat: 25.02, lng: 121.52 },
      { ...samplePlaces[1], id: "cluster-b", lat: 25.04, lng: 121.54 },
    ];
    const selectedId = places[0]?.id ?? "cluster-a";
    const { rerender } = render(
      <PlayMapLeaflet
        {...leafletProps({
          places,
          selectedId,
          clusterMode: true,
          viewportZoom: 13,
        })}
      />,
    );
    expect(
      markerSpy.mock.calls.some(
        ([props]) => props.zIndexOffset === 1000,
      ),
    ).toBe(true);

    markerSpy.mockClear();
    rerender(
      <PlayMapLeaflet
        {...leafletProps({
          places,
          selectedId,
          clusterMode: true,
          viewportZoom: 8,
        })}
      />,
    );
    expect(markerSpy.mock.calls.some(([props]) => props.zIndexOffset === 1000)).toBe(
      false,
    );
  });

  it("每根針都帶對應類型的剪影，且 glyph 掛在 pin 內", () => {
    divIconSpy.mockClear();
    const places = listPlaygrounds().slice(0, 6);
    render(<PlayMapLeaflet {...leafletProps({ places, clusterMode: false })} />);

    const htmls = divIconSpy.mock.calls
      .map((call) => call[0]?.html ?? "")
      .filter((html) => html.includes("playMapMarkerButton"));
    expect(htmls).toHaveLength(places.length);

    for (const [index, place] of places.entries()) {
      const html = htmls[index] ?? "";
      const key = playgroundTypeVisualKey(place.type);
      expect(html).toContain(`data-playground-id="${place.id}"`);
      expect(html).toContain(`data-type="${key}"`);
      // 剪影必須包在 playMapPinGlyph 內，語意由外層 button 承擔
      expect(html).toContain(
        `<span class="playMapPinGlyph">${playgroundTypeGlyphSvg(key)}</span>`,
      );
    }
  });

  it("marker hover 回報對應 id，且只更新狀態不重建 icon", () => {
    const place = samplePlaces[0];
    expect(place).toBeDefined();
    if (!place) return;
    const onHover = vi.fn();
    const onBlur = vi.fn();
    divIconSpy.mockClear();

    const { rerender } = render(
      <PlayMapLeaflet
        {...leafletProps({ onHover, onBlur, hoveredPlaceId: null })}
      />,
    );
    const initialIconCount = divIconSpy.mock.calls.filter(([options]) =>
      options?.html?.includes("playMapMarkerButton"),
    ).length;
    const marker = markerSpy.mock.calls.find(
      ([props]) => JSON.stringify(props.position) === JSON.stringify([place.lat, place.lng]),
    )?.[0];
    expect(marker?.eventHandlers?.mouseover).toBeTypeOf("function");
    expect(marker?.eventHandlers?.mouseout).toBeTypeOf("function");

    marker?.eventHandlers?.mouseover?.(undefined as never);
    marker?.eventHandlers?.mouseout?.(undefined as never);
    expect(onHover).toHaveBeenCalledWith(place.id);
    expect(onBlur).toHaveBeenCalledWith(place.id);

    rerender(
      <PlayMapLeaflet
        {...leafletProps({ onHover, onBlur, hoveredPlaceId: place.id })}
      />,
    );
    const nextIconCount = divIconSpy.mock.calls.filter(([options]) =>
      options?.html?.includes("playMapMarkerButton"),
    ).length;
    expect(nextIconCount).toBe(initialIconCount);
  });

  it("點到 marker 內的 SVG glyph 時，focus trigger 仍回到 marker button", () => {
    const place = samplePlaces[0];
    expect(place).toBeDefined();
    if (!place) return;

    const onSelect = vi.fn();
    render(<PlayMapLeaflet {...leafletProps({ onSelect })} />);
    const marker = markerSpy.mock.calls.find(
      ([props]) => JSON.stringify(props.position) === JSON.stringify([place.lat, place.lng]),
    )?.[0];
    expect(marker?.eventHandlers?.click).toBeTypeOf("function");

    const button = document.createElement("button");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    button.append(path);
    document.body.append(button);

    marker?.eventHandlers?.click?.({
      originalEvent: { target: path },
    } as never);

    expect(onSelect).toHaveBeenCalledWith(place.id, button);
    button.remove();
  });

  it("選中針的 zIndexOffset 為 1000，其餘為 0", () => {
    const places = listPlaygrounds().slice(0, 3);
    const selected = places[1];
    expect(selected).toBeDefined();
    if (!selected) return;

    render(
      <PlayMapLeaflet
        {...leafletProps({
          places,
          selectedId: selected.id,
          hoveredPlaceId: selected.id,
        })}
      />,
    );

    const offsetsByPosition = new Map(
      markerSpy.mock.calls.map(([props]) => [
        JSON.stringify(props.position),
        props.zIndexOffset,
      ]),
    );
    expect(offsetsByPosition).toEqual(
      new Map(
        places.map((place) => [
          JSON.stringify([place.lat, place.lng]),
          place.id === selected.id ? 1000 : 0,
        ]),
      ),
    );
  });

  it("city aggregate marker 不接 individual card hover synchronization", () => {
    const onHover = vi.fn();
    render(
      <PlayMapLeaflet
        {...leafletProps({
          clusterMode: true,
          onHover,
          hoveredPlaceId: samplePlaces[0]?.id ?? null,
        })}
      />,
    );

    expect(markerSpy.mock.calls).toHaveLength(
      clusterPlaygroundsByCity(samplePlaces).length,
    );
    for (const [props] of markerSpy.mock.calls) {
      expect(props.eventHandlers?.mouseover).toBeUndefined();
      expect(props.eventHandlers?.mouseout).toBeUndefined();
    }
    expect(onHover).not.toHaveBeenCalled();
  });

  it("不再渲染過時的地圖操作說明", () => {
    render(
      <PlayMapLeaflet
        {...leafletProps({
          places: [...listPlaygrounds()],
          clusterMode: true,
          viewportZoom: 8,
        })}
      />,
    );
    expect(screen.queryByText("點縣市看該區地點，或先點附近")).toBeNull();
    expect(screen.queryByText("雙指或工具列可縮放")).toBeNull();
    expect(screen.queryByText("點區域群組聚焦，或繼續縮放看單點")).toBeNull();
  });

  it("個別標記模式也不再顯示縮放教學", () => {
    render(
      <PlayMapLeaflet
        {...leafletProps({
          clusterMode: false,
          viewportZoom: 14,
        })}
      />,
    );
    expect(screen.queryByText("雙指或工具列可縮放")).toBeNull();
    expect(screen.queryByText("點縣市看該區地點，或先點附近")).toBeNull();
  });
});
