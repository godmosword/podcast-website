// @vitest-environment jsdom
import React, { StrictMode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FLY_DURATION_MS } from "./useMapCamera";

// StrictMode 會模擬「掛載→卸載→重掛載」把 effect 跑兩輪；本測試鎖定
// deep-link 門閂在該情境下仍能開 sheet（TODOS「?zone= dev 不開 sheet」回歸）。

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams("zone=dino"),
}));

vi.mock("@/lib/sfx", () => ({ playSfx: vi.fn() }));

// jsdom 無 SVG getTotalLength：roamer 模擬非本測試對象，直接空殼化。
vi.mock("./MapRoamerLayer", () => ({ default: () => null }));
vi.mock("./IslandRoamerLayer", () => ({ default: () => null }));
// jsdom canvas.toDataURL 回 null，webp 偵測非本測試對象。
vi.mock("@/hooks/useWebpSupported", () => ({ useWebpSupported: () => false }));

function stubBrowserApis() {
  vi.stubGlobal("React", React);
  // camera ready gate 依賴首次量測非零尺寸；jsdom 預設回 0×0。
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

describe("UniverseMap deep link（StrictMode）", () => {
  beforeEach(() => {
    stubBrowserApis();
    sessionStorage.clear();
    window.history.replaceState(null, "", "/adventures?zone=dino");
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function renderMap() {
    const { default: UniverseMap } = await import("./UniverseMap");
    render(
      <StrictMode>
        <ThemeProvider>
          <UniverseMap />
        </ThemeProvider>
      </StrictMode>,
    );
  }

  it("StrictMode 雙 effect 下 ?zone=dino 仍在 fly 之後開 sheet", async () => {
    await renderMap();

    expect(screen.queryByRole("dialog")).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(FLY_DURATION_MS + 50);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("恐龍島");
  });

  it("深連結入場會預寫 entry key，跳過進場降落動畫", async () => {
    expect(sessionStorage.getItem("cc-universe-entry-played")).toBeNull();
    await renderMap();
    expect(sessionStorage.getItem("cc-universe-entry-played")).toBe("1");
  });
});
