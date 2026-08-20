// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import { clusterPlaygroundsByCity } from "@/lib/playground-clusters";
import ProtoNationalMap, {
  protoCityClusterIconHtml,
} from "./ProtoNationalMap";

vi.stubGlobal("React", React);
vi.mock("leaflet/dist/leaflet.css", () => ({}));

type MarkerSpyProps = {
  eventHandlers?: { click?: () => void };
};

const { divIconSpy } = vi.hoisted(() => ({
  divIconSpy: vi.fn<(options?: { html?: string; iconSize?: number[]; iconAnchor?: number[] }) => object>(
    () => ({}),
  ),
}));

vi.mock("leaflet", () => {
  const leaflet = {
    divIcon: divIconSpy,
  };
  return { default: leaflet, ...leaflet };
});

const setView = vi.fn();
const mapStub = {
  setView,
  invalidateSize: vi.fn(),
  getSize: vi.fn(() => ({ x: 366, y: 780 })),
  getBounds: vi.fn(() => ({ getWest: () => 120.35 })),
  getContainer: vi.fn(() => document.createElement("div")),
  whenReady: vi.fn((cb: () => void) => cb()),
  on: vi.fn(),
  off: vi.fn(),
  latLngToContainerPoint: vi.fn(() => ({ x: 100, y: 100 })),
  containerPointToLatLng: vi.fn(() => ({ lat: 23.75, lng: 121 })),
};

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="proto-leaflet">{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({ eventHandlers }: MarkerSpyProps) => (
    <button type="button" onClick={() => eventHandlers?.click?.()}>
      marker
    </button>
  ),
  Polyline: () => null,
  CircleMarker: () => null,
  useMap: () => mapStub,
}));

afterEach(() => {
  cleanup();
  divIconSpy.mockClear();
});

describe("ProtoNationalMap variant A", () => {
  it("用 listPlaygrounds 的 city cluster，icon 為 44×44 且含縣市名與數量", () => {
    const onSelectCity = vi.fn();
    render(
      <ProtoNationalMap
        mode="A"
        onSelectCity={onSelectCity}
        onSample={vi.fn()}
      />,
    );

    const expected = clusterPlaygroundsByCity(listPlaygrounds());
    expect(divIconSpy).toHaveBeenCalledTimes(expected.length);
    expect(expected).toHaveLength(15);

    const first = expected[0]!;
    const options = divIconSpy.mock.calls.find((call) =>
      String(call[0]?.html).includes(first.city),
    )?.[0];
    expect(options?.iconSize).toEqual([44, 44]);
    expect(options?.iconAnchor).toEqual([22, 22]);
    expect(options?.html).toBe(protoCityClusterIconHtml(first));
    expect(options?.html).toContain("playMapMarkerName");
    expect(options?.html).toContain("playMapClusterCount");
  });

  it("點 marker 呼叫同一個 onSelectCity", () => {
    const onSelectCity = vi.fn();
    const { getAllByRole } = render(
      <ProtoNationalMap
        mode="A"
        onSelectCity={onSelectCity}
        onSample={vi.fn()}
      />,
    );
    getAllByRole("button")[0]?.click();
    expect(onSelectCity).toHaveBeenCalledTimes(1);
    expect(typeof onSelectCity.mock.calls[0]?.[0]).toBe("string");
  });
});
