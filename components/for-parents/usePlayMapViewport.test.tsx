// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  arePlayMapBoundsMeaningfullyDifferent,
  usePlayMapViewport,
} from "./usePlayMapViewport";

const initialBounds = {
  south: 24.8,
  west: 120.8,
  north: 25.4,
  east: 121.8,
};

const movedBounds = {
  south: 24.9,
  west: 121.0,
  north: 25.5,
  east: 122.0,
};

const laterBounds = {
  south: 25.0,
  west: 121.2,
  north: 25.6,
  east: 122.2,
};

function Harness() {
  const viewport = usePlayMapViewport();
  return (
    <>
      <output data-testid="pending">
        {String(viewport.hasPendingViewportSearch)}
      </output>
      <output data-testid="active">
        {String(viewport.committedSearchBounds !== null)}
      </output>
      <button
        type="button"
        onClick={() =>
          viewport.handleViewportSettled(
            { bounds: initialBounds, zoom: 8 },
            "programmatic",
          )
        }
      >
        initial
      </button>
      <button
        type="button"
        onClick={() =>
          viewport.handleViewportSettled(
            { bounds: movedBounds, zoom: 9 },
            "user",
          )
        }
      >
        user move
      </button>
      <button
        type="button"
        onClick={() =>
          viewport.handleViewportSettled(
            { bounds: laterBounds, zoom: 10 },
            "user",
          )
        }
      >
        user move again
      </button>
      <button type="button" onClick={viewport.handleCommitViewportSearch}>
        commit
      </button>
      <button type="button" onClick={viewport.handleClearViewportSearch}>
        clear
      </button>
    </>
  );
}

describe("usePlayMapViewport", () => {
  it("只把 user move 變成 pending，commit／clear 具有明確邊界", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "initial" }));
    expect(screen.getByTestId("pending").textContent).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "user move" }));
    expect(screen.getByTestId("pending").textContent).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "commit" }));
    expect(screen.getByTestId("active").textContent).toBe("true");
    expect(screen.getByTestId("pending").textContent).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "user move again" }));
    expect(screen.getByTestId("pending").textContent).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "clear" }));
    expect(screen.getByTestId("active").textContent).toBe("false");
  });

  it("量化 bounds 可避免極小地圖位移造成按鈕 flicker", () => {
    expect(
      arePlayMapBoundsMeaningfullyDifferent(initialBounds, {
        south: 24.8002,
        west: 120.8002,
        north: 25.4002,
        east: 121.8002,
      }),
    ).toBe(false);
    expect(arePlayMapBoundsMeaningfullyDifferent(initialBounds, movedBounds)).toBe(
      true,
    );
  });
});
