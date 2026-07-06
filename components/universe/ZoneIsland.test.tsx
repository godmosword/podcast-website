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
        onWish={() => undefined}
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
        onWish={() => undefined}
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

  it("鎖島看看鈕併入 pillRow 且 pillRow 不 aria-hidden", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        onWish={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );

    const pillRow = html.match(/(<span class="[^"]*pillRow[^"]*"[^>]*>)(.*?)<\/span><\/span>/);
    expect(pillRow?.[1]).not.toContain("aria-hidden");
    expect(pillRow?.[2]).toContain("建造中");
    expect(pillRow?.[2]).toContain("看看");
  });

  it("開放島不顯示看看鈕", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        onWish={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );

    expect(html).not.toContain("車車樂園看看");
  });
});
