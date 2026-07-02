import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getZoneArtSrcSet } from "@/lib/universe/zone-art-src";
import ZoneIslandTileArt from "./ZoneIslandTileArt";

vi.stubGlobal("React", React);

describe("ZoneIslandTileArt", () => {
  it("渲染沙草佔位與 srcset", () => {
    const artSrc = getZoneArtSrcSet("car-park");
    const html = renderToStaticMarkup(
      <ZoneIslandTileArt zoneId="car-park" artSrc={artSrc} anchorUV={[0.5, 0.84]} />,
    );
    expect(html).toContain("tilePlaceholder");
    expect(html).toContain('type="image/webp"');
    expect(html).toContain("car-park@2x.webp");
    expect(html).toContain("car-park@2x.png");
  });
});
