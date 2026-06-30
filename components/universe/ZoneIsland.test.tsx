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
});
