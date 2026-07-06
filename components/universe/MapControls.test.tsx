import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import MapControls from "./MapControls";

vi.stubGlobal("React", React);

describe("MapControls", () => {
  it("disables zoom buttons at scale limits", () => {
    const html = renderToStaticMarkup(
      <MapControls
        onReset={() => undefined}
        onZoomIn={() => undefined}
        onZoomOut={() => undefined}
        canZoomIn={false}
        canZoomOut={false}
      />,
    );

    expect(html).toContain('aria-label="放大地圖" disabled=""');
    expect(html).toContain('aria-label="縮小地圖" disabled=""');
  });
});
