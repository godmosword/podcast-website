// @vitest-environment jsdom
import React, { useState } from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { MapCamera } from "./useMapCamera";

const flyToMock = vi.fn();
const resetMock = vi.fn();
let setMeasuredExternal: ((value: boolean) => void) | null = null;
let setLayoutExternal: ((value: "landscape" | "portrait") => void) | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/adventures/dino",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("./MapRoamerLayer", () => ({ default: () => null }));
vi.mock("./IslandRoamerLayer", () => ({ default: () => null }));
vi.mock("@/hooks/useWebpSupported", () => ({ useWebpSupported: () => false }));

vi.mock("./useMapCamera", () => ({
  FLY_DURATION_MS: 450,
  ENTRY_PLAYED_KEY: "cc-universe-entry-played",
  useMapCamera: () => {
    const [isMeasured, setIsMeasured] = useState(false);
    const [layout, setLayout] = useState<"landscape" | "portrait">("landscape");
    setMeasuredExternal = setIsMeasured;
    setLayoutExternal = setLayout;
    const camera: MapCamera = {
      scale: 1,
      tx: 0,
      ty: 0,
      isMeasured,
      layout,
      isAnimating: false,
      isInteracting: false,
      idleEpoch: 0,
      canZoomIn: true,
      canZoomOut: true,
      bind: {
        ref: () => {},
        onPointerDown: () => {},
        onPointerMove: () => {},
        onPointerUp: () => {},
        onPointerCancel: () => {},
      },
      bindVisual: () => {},
      getCam: () => ({ scale: 1, tx: 0, ty: 0 }),
      getFlyDurationMs: () => 450,
      flyTo: flyToMock,
      reset: resetMock,
      zoomBy: () => {},
      panBy: () => {},
    };
    return camera;
  },
}));

function stubBrowserApis() {
  vi.stubGlobal("React", React);
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width: 1280,
    height: 800,
    top: 0,
    left: 0,
    right: 1280,
    bottom: 800,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

describe("UniverseMap isMeasured → flyTo", () => {
  beforeEach(() => {
    stubBrowserApis();
    sessionStorage.clear();
    window.history.replaceState(null, "", "/adventures/dino");
    flyToMock.mockClear();
    resetMock.mockClear();
    setMeasuredExternal = null;
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("isMeasured 為 false 時不觸發 flyTo；轉 true 後觸發一次", async () => {
    const { default: UniverseMap } = await import("./UniverseMap");
    render(
      <ThemeProvider>
        <UniverseMap />
      </ThemeProvider>,
    );

    expect(flyToMock).not.toHaveBeenCalled();

    await act(async () => {
      setMeasuredExternal?.(true);
    });

    await waitFor(() => {
      expect(flyToMock).toHaveBeenCalledTimes(1);
    });
    // 進島帶 level: "island"（直式 chrome-free 盒），首次不是 instant
    expect(flyToMock.mock.calls[0]?.[2]).toMatchObject({ level: "island", instant: false });
  });

  it("版面翻轉：同一島目標以 instant 重套、座標換成直式 tileBox（美術審 H3）", async () => {
    const { default: UniverseMap } = await import("./UniverseMap");
    const { islandFocus } = await import("@/lib/universe/map-camera-utils");
    render(
      <ThemeProvider>
        <UniverseMap />
      </ThemeProvider>,
    );
    await act(async () => {
      setMeasuredExternal?.(true);
    });
    await waitFor(() => {
      expect(flyToMock).toHaveBeenCalledTimes(1);
    });
    expect(flyToMock.mock.calls[0]?.[0]).toEqual(islandFocus("dino", "landscape").center);

    await act(async () => {
      setLayoutExternal?.("portrait");
    });
    await waitFor(() => {
      expect(flyToMock).toHaveBeenCalledTimes(2);
    });
    expect(flyToMock.mock.calls[1]?.[0]).toEqual(islandFocus("dino", "portrait").center);
    expect(flyToMock.mock.calls[1]?.[2]).toMatchObject({ level: "island", instant: true });
    // 舞台尺寸跟著版面換
    const stage = document.querySelector("[data-map-stage]") as HTMLElement;
    expect(stage.getAttribute("data-layout")).toBe("portrait");
    expect(stage.style.width).toBe("720px");
    expect(stage.style.height).toBe("1400px");
  });
});
