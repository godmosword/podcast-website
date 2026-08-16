// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import { clusterPlaygroundsByCity } from "@/lib/playground-clusters";
import { DEFAULT_PLAY_MAP_CENTER } from "@/lib/playground-coverage";
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

const mapStub = {
  fitBounds,
  setView,
  invalidateSize: vi.fn(),
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
    onSelect: vi.fn(),
    reduceMotion: true,
    active: true,
    clusterMode: false,
    cityClusters: clusterPlaygroundsByCity(places),
    onSelectCity: vi.fn(),
    userLatLng: null,
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
    markerSpy.mockClear();
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
      expect(html).toContain(`data-type="${key}"`);
      // 剪影必須包在 playMapPinGlyph 內——它負責反轉抵銷水滴的 rotate(-45deg)
      expect(html).toContain(
        `<span class="playMapPinGlyph">${playgroundTypeGlyphSvg(key)}</span>`,
      );
    }
  });

  it("選中針的 zIndexOffset 為 1000，其餘為 0", () => {
    const places = listPlaygrounds().slice(0, 3);
    const selected = places[1];
    expect(selected).toBeDefined();
    if (!selected) return;

    render(
      <PlayMapLeaflet
        {...leafletProps({ places, selectedId: selected.id })}
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
});
