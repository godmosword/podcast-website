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
  fitScaleForBox,
  flyDurationFor,
  islandContentCenter,
  islandFocus,
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

/** 進島構圖 harness：以 fitBox 夾住「島放得進畫面」的縮放上限。 */
function FitBoxHarness() {
  const camera = useMapCamera({ skipEntryAnimation: true });
  const box = islandFocus("car-park").box;

  return (
    <div
      data-testid="viewport"
      ref={camera.bind.ref}
      data-measured={camera.isMeasured ? "1" : "0"}
      data-scale={String(camera.scale)}
    >
      <button
        type="button"
        onClick={() => camera.flyTo(islandFocus("car-park").center, 1.6)}
      >
        進島（不夾）
      </button>
      <button
        type="button"
        onClick={() =>
          camera.flyTo(islandFocus("car-park").center, 1.6, { fitBox: box })
        }
      >
        進島（夾 fitBox）
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

  it("flyTo 的 fitBox 在手機直向夾住進島縮放（島不超出畫面）", async () => {
    stubBrowserApis({ width: 390, height: 640 });
    render(<FitBoxHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("1");
    });

    const viewport = screen.getByTestId("viewport");
    const box = islandFocus("car-park").box;

    fireEvent.click(screen.getByRole("button", { name: "進島（不夾）" }));
    await waitFor(() => {
      expect(Number(viewport.getAttribute("data-scale"))).toBeCloseTo(1.6, 5);
    });

    fireEvent.click(screen.getByRole("button", { name: "進島（夾 fitBox）" }));
    await waitFor(() => {
      const scale = Number(viewport.getAttribute("data-scale"));
      // 390×640 是手機直向 → 版面為 portrait，fit 盒不扣右欄（美術審 H3），
      // 比橫式算法（0.81）寬鬆，但島仍不超出畫面。
      expect(scale).toBeCloseTo(fitScaleForBox(box, 390, 640, "portrait"), 5);
      expect(scale).toBeGreaterThan(fitScaleForBox(box, 390, 640, "landscape"));
      expect(scale).toBeLessThan(1.6);
      expect(box.w * scale).toBeLessThanOrEqual(390);
    });
  });

  it("桌面視窗 fitBox 不改變進島縮放（維持 1.6）", async () => {
    stubBrowserApis({ width: 1280, height: 800 });
    render(<FitBoxHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("viewport").getAttribute("data-measured")).toBe("1");
    });

    fireEvent.click(screen.getByRole("button", { name: "進島（夾 fitBox）" }));
    await waitFor(() => {
      expect(
        Number(screen.getByTestId("viewport").getAttribute("data-scale")),
      ).toBeCloseTo(1.6, 5);
    });
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

/** 版面 harness：暴露 layout／pose，並用真的 ResizeObserver 回呼模擬旋轉。 */
let resizeCallback: (() => void) | null = null;

function LayoutHarness() {
  const camera = useMapCamera({ skipEntryAnimation: true });
  return (
    <div
      data-testid="viewport"
      ref={camera.bind.ref}
      data-measured={camera.isMeasured ? "1" : "0"}
      data-layout={camera.layout}
      data-scale={String(camera.scale)}
      data-tx={String(camera.tx)}
      data-ty={String(camera.ty)}
    />
  );
}

/** 版面翻轉回呼 harness：hook 回呼時以 instant reset 重套（與 UniverseMap 同一做法）。 */
function LayoutCallbackHarness() {
  const apiRef = React.useRef<{ reset: (o?: { instant?: boolean }) => void } | null>(null);
  const calls = React.useRef<string[]>([]);
  const camera = useMapCamera({
    skipEntryAnimation: true,
    onLayoutChange: (layout) => {
      calls.current.push(layout);
      apiRef.current?.reset({ instant: true });
    },
  });
  apiRef.current = { reset: camera.reset };
  return (
    <div
      data-testid="viewport"
      ref={camera.bind.ref}
      data-measured={camera.isMeasured ? "1" : "0"}
      data-layout={camera.layout}
      data-scale={String(camera.scale)}
      data-animating={camera.isAnimating ? "1" : "0"}
      data-calls={calls.current.join(",")}
    >
      <button type="button" onClick={() => camera.flyTo({ x: 300, y: 300 }, 1.6)}>
        飛
      </button>
      <button type="button" onClick={() => camera.reset({ instant: true })}>
        瞬間回樂園
      </button>
    </div>
  );
}

describe("useMapCamera 版面（美術審 H3）", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resizeCallback = null;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function stubResizable(size: { width: number; height: number }) {
    const current = { ...size };
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          width: current.width,
          height: current.height,
          top: 0,
          left: 0,
          right: current.width,
          bottom: current.height,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    );
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
        constructor(cb: () => void) {
          resizeCallback = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 0),
    );
    return current;
  }

  it("390×844 首次量測即為 portrait，首 pose 是直式 fit（同一 tick，無橫式首幀）", async () => {
    stubResizable({ width: 390, height: 844 });
    render(<LayoutHarness />);
    const viewport = screen.getByTestId("viewport");
    await waitFor(() => {
      expect(viewport.getAttribute("data-measured")).toBe("1");
    });
    expect(viewport.getAttribute("data-layout")).toBe("portrait");
    const scale = Number(viewport.getAttribute("data-scale"));
    expect(scale).toBeCloseTo(fitScaleFor(390, 844, "portrait"), 5);
    expect(scale).toBeGreaterThan(fitScaleFor(390, 844, "landscape"));
    // 直式群島置中在 chrome-free 盒（頂 28／底 148）而非整個視窗：ty 比純置中小
    const ty = Number(viewport.getAttribute("data-ty"));
    const naive = clampCamera(
      poseFor(islandContentCenter("portrait"), scale, 390, 844),
      390,
      844,
      { width: 720, height: 1400 },
    ).ty;
    expect(ty).toBeLessThan(naive);
  });

  it("1280×800 維持 landscape，pose 與舊算式零差", async () => {
    stubResizable({ width: 1280, height: 800 });
    render(<LayoutHarness />);
    const viewport = screen.getByTestId("viewport");
    await waitFor(() => {
      expect(viewport.getAttribute("data-measured")).toBe("1");
    });
    expect(viewport.getAttribute("data-layout")).toBe("landscape");
    const scale = Number(viewport.getAttribute("data-scale"));
    const expected = clampCamera(
      poseFor(islandContentCenter(), fitScaleFor(1280, 800), 1280, 800),
      1280,
      800,
    );
    expect(scale).toBeCloseTo(expected.scale, 5);
    expect(Number(viewport.getAttribute("data-tx"))).toBeCloseTo(expected.tx, 3);
    expect(Number(viewport.getAttribute("data-ty"))).toBeCloseTo(expected.ty, 3);
  });

  it("旋轉：isMobilePortrait 翻轉才換版面；同版面 resize 只 clamp、不換版面", async () => {
    const size = stubResizable({ width: 390, height: 844 });
    render(<LayoutHarness />);
    const viewport = screen.getByTestId("viewport");
    await waitFor(() => {
      expect(viewport.getAttribute("data-layout")).toBe("portrait");
    });
    // iOS 網址列收放：高度變、版面不變
    size.height = 760;
    act(() => resizeCallback?.());
    await waitFor(() => {
      expect(viewport.getAttribute("data-layout")).toBe("portrait");
    });
    // 旋轉成橫向
    size.width = 844;
    size.height = 390;
    act(() => resizeCallback?.());
    await waitFor(() => {
      expect(viewport.getAttribute("data-layout")).toBe("landscape");
    });
    // 轉回直向
    size.width = 390;
    size.height = 844;
    act(() => resizeCallback?.());
    await waitFor(() => {
      expect(viewport.getAttribute("data-layout")).toBe("portrait");
    });
  });

  it("翻版面時同一 tick 回呼 onLayoutChange，回呼的 instant reset 直接落在新版面 fit", async () => {
    const size = stubResizable({ width: 390, height: 844 });
    render(<LayoutCallbackHarness />);
    const viewport = screen.getByTestId("viewport");
    await waitFor(() => {
      expect(viewport.getAttribute("data-layout")).toBe("portrait");
    });
    size.width = 844;
    size.height = 390;
    act(() => resizeCallback?.());
    await waitFor(() => {
      expect(viewport.getAttribute("data-layout")).toBe("landscape");
    });
    expect(viewport.getAttribute("data-calls")).toBe("landscape");
    expect(Number(viewport.getAttribute("data-scale"))).toBeCloseTo(
      fitScaleFor(844, 390, "landscape"),
      5,
    );
    expect(viewport.getAttribute("data-animating")).toBe("0");
  });

  it("instant 中斷進行中的飛行：isAnimating 立刻收尾", async () => {
    stubResizable({ width: 390, height: 844 });
    render(<LayoutCallbackHarness />);
    const viewport = screen.getByTestId("viewport");
    await waitFor(() => {
      expect(viewport.getAttribute("data-measured")).toBe("1");
    });
    fireEvent.click(screen.getByRole("button", { name: "飛" }));
    await waitFor(() => {
      expect(viewport.getAttribute("data-animating")).toBe("1");
    });
    fireEvent.click(screen.getByRole("button", { name: "瞬間回樂園" }));
    await waitFor(() => {
      expect(viewport.getAttribute("data-animating")).toBe("0");
    });
    expect(Number(viewport.getAttribute("data-scale"))).toBeCloseTo(
      fitScaleFor(390, 844, "portrait"),
      5,
    );
  });
});
