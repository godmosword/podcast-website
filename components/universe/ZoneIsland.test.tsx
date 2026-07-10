import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { mapDepthZ } from "@/lib/universe-depth";
import { resolveUniverseMap } from "@/lib/universe-map";
import ZoneIsland from "./ZoneIsland";

vi.stubGlobal("React", React);

describe("ZoneIsland", () => {
  it("puts the island body and readable label into separate depth bands", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );

    expect(html).toContain(`z-index:${mapDepthZ(zone.depthY, "island")}`);
    expect(html).toContain(`z-index:${mapDepthZ(zone.depthY, "label")}`);
  });

  it("island tile 輸出 srcSet，標籤依 mapScale 反縮放", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        mapScale={2}
        reduced
        paused={false}
        night={false}
      />,
    );

    expect(html).toContain("264w");
    expect(html).toContain("528w");
    expect(html).toContain("792w");
    expect(html).toContain("scale(0.5)");
  });

  it("統一點擊語意：鎖島不再有獨立看看鈕，pill 帶學齡前語意 icon", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );

    expect(html).not.toContain("看看");
    expect(html).toContain("🚧 建造中");
  });

  it("開放島顯示「可以進去玩」氣球訊號，鎖島不顯示", () => {
    const zones = resolveUniverseMap().zones;
    const openHtml = renderToStaticMarkup(
      <ZoneIsland
        zone={zones.find((z) => z.id === "car-park")!}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );
    const lockedHtml = renderToStaticMarkup(
      <ZoneIsland
        zone={zones.find((z) => z.id === "dino")!}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );

    expect(openHtml).toContain("🎈");
    expect(openHtml).toContain("🎉 開放中");
    expect(lockedHtml).not.toContain("🎈");
  });
});
