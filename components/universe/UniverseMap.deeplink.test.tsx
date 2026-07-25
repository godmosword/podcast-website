// @vitest-environment jsdom
import React, { StrictMode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TAP_HINT_KEY } from "./UniverseMap";

// M1：深連結改為 /adventures/[zone]；MapStage 跟 pathname 飛鏡頭，overlay 由子路由渲染。

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/adventures/dino",
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

describe("UniverseMap 島路徑（StrictMode）", () => {
  beforeEach(() => {
    stubBrowserApis();
    sessionStorage.clear();
    window.history.replaceState(null, "", "/adventures/dino");
    pushMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function renderMap(children?: React.ReactNode) {
    const { default: UniverseMap } = await import("./UniverseMap");
    render(
      <StrictMode>
        <ThemeProvider>
          <UniverseMap>{children}</UniverseMap>
        </ThemeProvider>
      </StrictMode>,
    );
  }

  it("島路徑入場會預寫 entry key，跳過進場降落動畫", async () => {
    expect(sessionStorage.getItem("cc-universe-entry-played")).toBeNull();
    await renderMap();
    expect(sessionStorage.getItem("cc-universe-entry-played")).toBe("1");
  });

  it("島路徑不顯示 tap hint、也不寫 tap hint key", async () => {
    await renderMap();
    expect(screen.queryByRole("status")).toBeNull();
    expect(sessionStorage.getItem(TAP_HINT_KEY)).toBeNull();
  });

  it("島路徑 children（overlay）會掛在地圖內", async () => {
    await renderMap(<div role="dialog">恐龍島</div>);
    expect(screen.getByRole("dialog").textContent).toContain("恐龍島");
  });
});
