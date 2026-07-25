// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fitScaleFor } from "@/lib/universe/map-camera-utils";
import {
  ENTRY_PLAYED_KEY,
  useMapCamera,
  type UseMapCameraOptions,
} from "./useMapCamera";

function stubBrowserApis(size: { width: number; height: number } = {
  width: 1280,
  height: 800,
}) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width: size.width,
    height: size.height,
    top: 0,
    left: 0,
    right: size.width,
    bottom: size.height,
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
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 0),
  );
}

function CameraHarness({
  options,
  attachViewport = true,
}: {
  options?: UseMapCameraOptions;
  attachViewport?: boolean;
}) {
  const camera = useMapCamera(options);

  return (
    <div
      data-testid="viewport"
      ref={attachViewport ? camera.bind.ref : undefined}
      data-measured={camera.isMeasured ? "1" : "0"}
      data-scale={String(camera.scale)}
    />
  );
}

describe("useMapCamera", () => {
  beforeEach(() => {
    stubBrowserApis();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("skipEntryAnimation: true 時 render／未掛 viewport 不寫 sessionStorage", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    render(<CameraHarness options={{ skipEntryAnimation: true }} attachViewport={false} />);

    expect(setItemSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(ENTRY_PLAYED_KEY)).toBeNull();
    expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("0");
  });

  it("skipEntryAnimation: true 掛 viewport 後不播進場，並於 effect 寫入 entry key", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    render(<CameraHarness options={{ skipEntryAnimation: true }} />);

    await waitFor(() => {
      expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("1");
    });

    const fit = fitScaleFor(1280, 800);
    const scale = Number(screen.getByTestId("viewport").getAttribute("data-scale"));
    // 進場起始為 fit * 0.55；skip 時應直接落在 fit 附近
    expect(scale).toBeCloseTo(fit, 5);
    expect(scale).toBeGreaterThan(fit * 0.55 + 0.01);
    expect(sessionStorage.getItem(ENTRY_PLAYED_KEY)).toBe("1");
    expect(
      setItemSpy.mock.calls.some(([key]) => key === ENTRY_PLAYED_KEY),
    ).toBe(true);
  });

  it("首次有效量測後 isMeasured 為 true", async () => {
    render(<CameraHarness />);
    await waitFor(() => {
      expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("1");
    });
  });
});
