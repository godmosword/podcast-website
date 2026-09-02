// @vitest-environment jsdom
import React, { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TAP_HINT_KEY } from "./UniverseMap";

// StrictMode 會模擬 effect 雙跑；本測試鎖定 hint 僅 dismiss 才寫 session key，
// 且雙 effect 下仍只排程一次 visible（ref 門閂）。

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
  usePathname: () => "/adventures",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/sfx", () => ({ playSfx: vi.fn() }));

vi.mock("./MapRoamerLayer", () => ({ default: () => null }));
vi.mock("./IslandRoamerLayer", () => ({ default: () => null }));
vi.mock("@/hooks/useWebpSupported", () => ({ useWebpSupported: () => false }));

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

describe("UniverseMap tap hint（StrictMode）", () => {
  beforeEach(() => {
    stubBrowserApis();
    sessionStorage.clear();
    window.history.replaceState(null, "", "/adventures");
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

  it("StrictMode 雙 effect 下顯示 hint 且 show 前不寫 session key", async () => {
    await renderMap();

    expect(screen.getByRole("status").textContent).toContain(
      "點一座島，飛過去玩",
    );
    expect(sessionStorage.getItem(TAP_HINT_KEY)).toBeNull();
  });

  it("關閉鈕 dismiss 才寫 session key", async () => {
    await renderMap();

    fireEvent.click(screen.getByRole("button", { name: "關閉提示" }));

    expect(screen.queryByRole("status")).toBeNull();
    expect(sessionStorage.getItem(TAP_HINT_KEY)).toBe("1");
  });

  it("TTL 逾時 dismiss 才寫 session key", async () => {
    await renderMap();
    expect(sessionStorage.getItem(TAP_HINT_KEY)).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.queryByRole("status")).toBeNull();
    expect(sessionStorage.getItem(TAP_HINT_KEY)).toBe("1");
  });

  it("點島 dismiss 才寫 session key", async () => {
    await renderMap();

    const islandButtons = screen.getAllByRole("button", { name: /島/ });
    fireEvent.click(islandButtons[0]!);

    expect(screen.queryByRole("status")).toBeNull();
    expect(sessionStorage.getItem(TAP_HINT_KEY)).toBe("1");
  });

  it("sessionStorage 已有 key 時不顯示 hint", async () => {
    sessionStorage.setItem(TAP_HINT_KEY, "1");
    await renderMap();

    expect(screen.queryByRole("status")).toBeNull();
  });
});
