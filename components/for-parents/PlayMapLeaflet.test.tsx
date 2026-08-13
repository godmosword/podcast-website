// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import { clusterPlaygroundsByCity } from "@/lib/playground-clusters";
import { DEFAULT_PLAY_MAP_CENTER } from "@/lib/playground-coverage";
import PlayMapLeaflet, { playMapFitKey } from "./PlayMapLeaflet";
import type { PlayMapLeafletProps } from "./PlayMapLeaflet";

vi.stubGlobal("React", React);

vi.mock("leaflet/dist/leaflet.css", () => ({}));

vi.mock("leaflet", () => {
  class LatLngBounds {
    constructor(public points: unknown) {}
  }
  const leaflet = {
    latLngBounds: (points: unknown) => new LatLngBounds(points),
    divIcon: () => ({}),
  };
  return { default: leaflet, ...leaflet };
});

type Handler = (event?: unknown) => void;

const listeners = new Map<string, Set<Handler>>();

function emit(type: string): void {
  const set = listeners.get(type);
  if (!set) return;
  for (const handler of set) handler({});
}

const fitBounds = vi.fn(() => {
  emit("zoomstart");
});
const setView = vi.fn(() => {
  emit("zoomstart");
});

const mapStub = {
  fitBounds,
  setView,
  invalidateSize: vi.fn(),
  on(type: string, handler: Handler) {
    const set = listeners.get(type) ?? new Set<Handler>();
    set.add(handler);
    listeners.set(type, set);
    return this;
  },
  off(type: string, handler: Handler) {
    listeners.get(type)?.delete(handler);
    return this;
  },
};

const mapState: { current: typeof mapStub } = { current: mapStub };

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  Marker: () => null,
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

  it("clusterMode、筆數、selectedId 任一改變都會換鍵", () => {
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
  });
});

describe("PlayMapLeaflet FitBounds", () => {
  beforeEach(() => {
    fitBounds.mockClear();
    setView.mockClear();
    listeners.clear();
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
      <PlayMapLeaflet
        {...leafletProps({ onSelect: vi.fn(), splitLayout: false })}
      />,
    );
    expect(fitBounds).toHaveBeenCalledTimes(1);
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

  it("使用者拖曳後、fitKey 不變的重繪不會移動鏡頭", () => {
    const { rerender } = render(<PlayMapLeaflet {...leafletProps()} />);
    expect(fitBounds).toHaveBeenCalledTimes(1);

    emit("dragstart");
    // 換 useMap 參考以迫使 effect 重跑；fitKey 不變時應被 userMoved 擋下。
    mapState.current = { ...mapStub };
    rerender(
      <PlayMapLeaflet {...leafletProps({ onSelect: vi.fn() })} />,
    );
    expect(fitBounds).toHaveBeenCalledTimes(1);
  });

  it("使用者拖曳後 fitKey 改變仍會重算鏡頭", () => {
    const { rerender } = render(<PlayMapLeaflet {...leafletProps()} />);
    emit("dragstart");
    rerender(
      <PlayMapLeaflet
        {...leafletProps({ selectedId: samplePlaces[1]?.id ?? null })}
      />,
    );
    expect(fitBounds).toHaveBeenCalledTimes(2);
  });
});
