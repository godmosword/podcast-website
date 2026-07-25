// @vitest-environment jsdom
import React, { useState } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZONES } from "@/data/universe-zones";
import {
  UniverseCameraGateProvider,
  useUniverseCameraGate,
} from "./UniverseCameraGateContext";
import ZoneSheet from "./ZoneSheet";
import { useSheetReadyLatch } from "./useSheetReadyLatch";

vi.stubGlobal("React", React);

afterEach(() => {
  cleanup();
});

function LatchProbe({
  targetKey,
  onIsland,
  isAnimating,
  reducedMotion,
}: {
  targetKey: string;
  onIsland: boolean;
  isAnimating: boolean;
  reducedMotion: boolean;
}) {
  const sheetReady = useSheetReadyLatch({
    targetKey,
    onIsland,
    isAnimating,
    reducedMotion,
  });
  return <output data-testid="sheet-ready">{String(sheetReady)}</output>;
}

function ControlledLatchHarness() {
  const [targetKey, setTargetKey] = useState("island:dino");
  const [isAnimating, setIsAnimating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <>
      <LatchProbe
        targetKey={targetKey}
        onIsland={targetKey.startsWith("island:")}
        isAnimating={isAnimating}
        reducedMotion={reducedMotion}
      />
      <button type="button" onClick={() => setTargetKey("island:car-park")}>
        換島
      </button>
      <button type="button" onClick={() => setIsAnimating(true)}>
        開始飛
      </button>
      <button type="button" onClick={() => setIsAnimating(false)}>
        飛抵
      </button>
      <button type="button" onClick={() => setReducedMotion(true)}>
        開 reduced
      </button>
    </>
  );
}

function WorldToIslandHarness() {
  const [targetKey, setTargetKey] = useState("world");
  const onIsland = targetKey.startsWith("island:");

  return (
    <>
      <LatchProbe
        targetKey={targetKey}
        onIsland={onIsland}
        isAnimating={false}
        reducedMotion={false}
      />
      <button type="button" onClick={() => setTargetKey("island:dino")}>
        進島
      </button>
    </>
  );
}

describe("useSheetReadyLatch", () => {
  it("世界→島：targetKey 變更後第一個 render 即 sheetReady=false", () => {
    render(<WorldToIslandHarness />);
    expect(screen.getByTestId("sheet-ready").textContent).toBe("true");

    act(() => {
      screen.getByRole("button", { name: "進島" }).click();
    });
    expect(screen.getByTestId("sheet-ready").textContent).toBe("false");
  });

  it("cameraTarget.key 改變後 sheetReady 立刻為 false", () => {
    render(<ControlledLatchHarness />);
    expect(screen.getByTestId("sheet-ready").textContent).toBe("false");

    act(() => {
      screen.getByRole("button", { name: "換島" }).click();
    });
    expect(screen.getByTestId("sheet-ready").textContent).toBe("false");
  });

  it("深連結競態：isMeasured 前 isAnimating 為 false 時 sheetReady 仍為 false", () => {
    render(
      <LatchProbe
        targetKey="island:dino"
        onIsland
        isAnimating={false}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("sheet-ready").textContent).toBe("false");
  });

  it("isAnimating 由 true 轉 false 時 sheetReady 變 true", () => {
    render(<ControlledLatchHarness />);

    act(() => {
      screen.getByRole("button", { name: "開始飛" }).click();
    });
    expect(screen.getByTestId("sheet-ready").textContent).toBe("false");

    act(() => {
      screen.getByRole("button", { name: "飛抵" }).click();
    });
    expect(screen.getByTestId("sheet-ready").textContent).toBe("true");
  });

  it("reduced-motion 下 sheetReady 掛載即 true", () => {
    render(
      <LatchProbe
        targetKey="island:dino"
        onIsland
        isAnimating={false}
        reducedMotion
      />,
    );
    expect(screen.getByTestId("sheet-ready").textContent).toBe("true");
  });

  it("reduced-motion 換島仍維持 true", () => {
    render(<ControlledLatchHarness />);

    act(() => {
      screen.getByRole("button", { name: "開 reduced" }).click();
    });
    expect(screen.getByTestId("sheet-ready").textContent).toBe("true");

    act(() => {
      screen.getByRole("button", { name: "換島" }).click();
    });
    expect(screen.getByTestId("sheet-ready").textContent).toBe("true");
  });
});

describe("UniverseCameraGateContext", () => {
  it("Provider 外預設 sheetReady 為 true", () => {
    function Reader() {
      const { sheetReady } = useUniverseCameraGate();
      return <output data-testid="gate">{String(sheetReady)}</output>;
    }
    render(<Reader />);
    expect(screen.getByTestId("gate").textContent).toBe("true");
  });
});

describe("ZoneSheet sheetReady gate", () => {
  it("!sheetReady 時 overlay inert、dialog aria-hidden 且帶 hidden class", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const { container } = render(
      <UniverseCameraGateProvider value={{ sheetReady: false }}>
        <ZoneSheet zone={zone} onClose={() => undefined} />
      </UniverseCameraGateProvider>,
    );

    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog.getAttribute("aria-hidden")).toBe("true");
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay.hasAttribute("inert")).toBe(true);
    expect(container.querySelector('[class*="overlayHidden"]')).toBeTruthy();
    expect(container.querySelector('[class*="sheetHidden"]')).toBeTruthy();
    expect(container.querySelector('[class*="sheetAnimate"]')).toBeNull();
  });

  it("sheetReady 時才帶 sheet-rise 動畫 class", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const { container } = render(
      <UniverseCameraGateProvider value={{ sheetReady: true }}>
        <ZoneSheet zone={zone} onClose={() => undefined} />
      </UniverseCameraGateProvider>,
    );

    expect(container.querySelector('[class*="sheetAnimate"]')).toBeTruthy();
    expect(container.querySelector('[class*="sheetHidden"]')).toBeNull();
  });

  it("inert 且 sheetReady 時 overlay 穿透 class 存在、sheet 仍可見", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const { container } = render(
      <UniverseCameraGateProvider value={{ sheetReady: true }}>
        <ZoneSheet zone={zone} onClose={() => undefined} inert suppressFocusTrap />
      </UniverseCameraGateProvider>,
    );

    expect(container.querySelector('[class*="overlayPassthrough"]')).toBeTruthy();
    expect(container.querySelector('[class*="overlayInertPassthrough"]')).toBeTruthy();
    expect(container.querySelector('[class*="overlayHidden"]')).toBeNull();
    expect(container.querySelector('[class*="sheetAnimate"]')).toBeTruthy();
    expect(container.querySelector('[class*="sheetHidden"]')).toBeNull();
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay.hasAttribute("inert")).toBe(true);
  });
});
