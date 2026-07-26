// @vitest-environment jsdom
import React, { useEffect } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_FLY_MS,
  MIN_FLY_MS,
  clampCamera,
  clampScale,
  fitScaleFor,
  flyDurationFor,
  islandContentCenter,
  poseFor,
} from "@/lib/universe/map-camera-utils";
import {
  ENTRY_PLAYED_KEY,
  useMapCamera,
  type CameraVisualMeta,
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

function ResetHarness() {
  const camera = useMapCamera({ skipEntryAnimation: true });

  return (
    <div
      data-testid="viewport"
      ref={camera.bind.ref}
      data-measured={camera.isMeasured ? "1" : "0"}
      data-scale={String(camera.scale)}
      data-tx={String(camera.tx)}
      data-ty={String(camera.ty)}
    >
      <button
        type="button"
        onClick={() => camera.flyTo({ x: 120, y: 140 }, camera.scale * 1.6)}
      >
        偏離鏡頭
      </button>
      <button type="button" onClick={() => camera.reset()}>
        重置鏡頭
      </button>
    </div>
  );
}

function FlyDurationHarness({
  durationMs,
  onAnimatingMeta,
}: {
  durationMs?: number;
  onAnimatingMeta?: (meta: CameraVisualMeta) => void;
}) {
  const { bind, bindVisual, isMeasured, isAnimating, flyTo, scale } =
    useMapCamera({ skipEntryAnimation: true });

  useEffect(() => {
    bindVisual((_pose, meta) => {
      if (meta.isAnimating) onAnimatingMeta?.(meta);
    });
    return () => bindVisual(null);
  }, [bindVisual, onAnimatingMeta]);

  return (
    <div
      data-testid="viewport"
      ref={bind.ref}
      data-measured={isMeasured ? "1" : "0"}
      data-animating={isAnimating ? "1" : "0"}
    >
      <button
        type="button"
        onClick={() => flyTo({ x: 120, y: 140 }, scale * 1.2, { durationMs })}
      >
        飛行
      </button>
    </div>
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
    expect(sessionStorage.getItem(ENTRY_PLAYED_KEY)).toBeNull();
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
  });

  it("首次有效量測後 isMeasured 為 true", async () => {
    render(<CameraHarness />);
    await waitFor(() => {
      expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("1");
    });
  });

  it("reset() 飛向 islandContentCenter 並套用 fit scale", async () => {
    render(<ResetHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("1");
    });

    const viewport = screen.getByTestId("viewport");
    const w = 1280;
    const h = 800;
    const center = islandContentCenter();
    const fit = fitScaleFor(w, h);
    const expected = clampCamera(
      {
        scale: fit,
        tx: w / 2 - center.x * fit,
        ty: h / 2 - center.y * fit,
      },
      w,
      h,
    );

    fireEvent.click(screen.getByRole("button", { name: "偏離鏡頭" }));

    await waitFor(() => {
      const scale = Number(viewport.getAttribute("data-scale"));
      expect(scale).toBeGreaterThan(fit + 0.05);
    });

    fireEvent.click(screen.getByRole("button", { name: "重置鏡頭" }));

    await waitFor(() => {
      const scale = Number(viewport.getAttribute("data-scale"));
      expect(scale).toBeCloseTo(expected.scale, 5);
    });

    const tx = Number(viewport.getAttribute("data-tx"));
    const ty = Number(viewport.getAttribute("data-ty"));
    expect(tx).toBeCloseTo(expected.tx, 5);
    expect(ty).toBeCloseTo(expected.ty, 5);
  });

  it("flyTo 帶 durationMs 時，isAnimating 在該時長後轉 false", async () => {
    const customMs = 320;
    stubBrowserApis();
    render(<FlyDurationHarness durationMs={customMs} />);

    await waitFor(() => {
      expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("1");
    });

    vi.useFakeTimers();

    fireEvent.click(screen.getByRole("button", { name: "飛行" }));
    expect(screen.getByTestId("viewport").getAttribute("data-animating")).toBe("1");

    act(() => {
      vi.advanceTimersByTime(customMs - 1);
    });
    expect(screen.getByTestId("viewport").getAttribute("data-animating")).toBe("1");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("viewport").getAttribute("data-animating")).toBe("0");

    vi.useRealTimers();
  });

  it("bindVisual meta.flyDurationMs 預設為依距離推導的時長", async () => {
    const captured: CameraVisualMeta[] = [];
    stubBrowserApis();
    render(
      <FlyDurationHarness
        onAnimatingMeta={(meta) => {
          captured.push({ ...meta });
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("1");
    });

    // 重建 harness 的起訖鏡頭（viewport 1280×800、skipEntryAnimation → 起點為 fit 構圖）
    const W = 1280;
    const H = 800;
    const fit = fitScaleFor(W, H);
    const from = clampCamera(poseFor(islandContentCenter(), fit, W, H), W, H);
    const to = clampCamera(
      poseFor({ x: 120, y: 140 }, clampScale(fit * 1.2), W, H),
      W,
      H,
    );
    const expectedMs = flyDurationFor(from, to, W, H);

    fireEvent.click(screen.getByRole("button", { name: "飛行" }));
    expect(captured.some((m) => m.flyDurationMs === expectedMs)).toBe(true);
    // 推導值必落在上下限內，且不再等於舊的固定常數來源
    expect(expectedMs).toBeGreaterThanOrEqual(MIN_FLY_MS);
    expect(expectedMs).toBeLessThanOrEqual(MAX_FLY_MS);
  });

  it("bindVisual meta.flyDurationMs 等於自訂 durationMs", async () => {
    const captured: CameraVisualMeta[] = [];
    stubBrowserApis();
    render(
      <FlyDurationHarness
        durationMs={250}
        onAnimatingMeta={(meta) => {
          captured.push({ ...meta });
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("1");
    });

    fireEvent.click(screen.getByRole("button", { name: "飛行" }));
    expect(captured.some((m) => m.flyDurationMs === 250)).toBe(true);
  });
});
