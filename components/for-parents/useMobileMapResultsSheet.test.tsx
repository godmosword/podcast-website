// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  mobileMapSnapHeights,
  nearestMobileMapSnap,
  useMobileMapResultsSheet,
} from "./useMobileMapResultsSheet";

vi.stubGlobal("React", React);

function Harness({ active }: { active: boolean }) {
  const sheet = useMobileMapResultsSheet({ active });
  return (
    <div data-testid="container">
      <section
        ref={sheet.panelRef}
        data-snap={sheet.snap}
        role="region"
        aria-label="結果"
      >
        <button
          type="button"
          aria-label="結果列表"
          onClick={sheet.onHandleClick}
          onPointerDown={sheet.onHandlePointerDown}
          onPointerMove={sheet.onHandlePointerMove}
          onPointerUp={sheet.onHandlePointerUp}
          onPointerCancel={sheet.onHandlePointerCancel}
        />
        <output data-testid="resize-epoch">{sheet.resizeEpoch}</output>
      </section>
    </div>
  );
}

describe("useMobileMapResultsSheet", () => {
  afterEach(cleanup);

  it("provides collapsed, half, and expanded heights while leaving map visible", () => {
    const heights = mobileMapSnapHeights(400);

    expect(heights.collapsed).toBe(112);
    expect(heights.half).toBe(200);
    expect(heights.expanded).toBe(344);
    expect(nearestMobileMapSnap(240, 400)).toBe("half");
    expect(nearestMobileMapSnap(330, 400)).toBe("expanded");
  });

  it("cycles by handle, exposes a resize epoch, and resets on re-enter", () => {
    const { rerender } = render(<Harness active />);
    const panel = screen.getByRole("region", { hidden: true }) as HTMLElement;
    const handle = screen.getByRole("button", { name: "結果列表" });

    expect(panel.dataset.snap).toBe("half");
    expect(screen.getByTestId("resize-epoch").textContent).toBe("0");

    fireEvent.click(handle);
    expect(panel.dataset.snap).toBe("expanded");
    expect(screen.getByTestId("resize-epoch").textContent).toBe("1");
    fireEvent.click(handle);
    expect(panel.dataset.snap).toBe("collapsed");
    fireEvent.click(handle);
    expect(panel.dataset.snap).toBe("half");

    rerender(<Harness active={false} />);
    rerender(<Harness active />);
    expect(panel.dataset.snap).toBe("half");
  });

  it("dragging the explicit handle snaps to the nearest state", () => {
    const { container } = render(<Harness active />);
    const panel = container.querySelector("section") as HTMLElement;
    const host = screen.getByTestId("container");
    const handle = screen.getByRole("button", { name: "結果列表" });
    Object.defineProperty(host, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ height: 400 }),
    });
    Object.defineProperty(panel, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ height: 112 }),
    });

    fireEvent.pointerDown(handle, {
      pointerId: 1,
      pointerType: "touch",
      clientY: 300,
      button: 0,
    });
    fireEvent.pointerMove(handle, {
      pointerId: 1,
      pointerType: "touch",
      clientY: 160,
    });
    fireEvent.pointerUp(handle, {
      pointerId: 1,
      pointerType: "touch",
      clientY: 160,
    });

    expect(panel.dataset.snap).toBe("half");
    expect(panel.dataset.dragging).toBeUndefined();
  });
});
