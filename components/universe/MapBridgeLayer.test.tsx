import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { mapDepthZ } from "@/lib/universe-depth";
import { resolveUniverseMap } from "@/lib/universe-map";
import MapBridgeLayer from "./MapBridgeLayer";

vi.stubGlobal("React", React);

describe("MapBridgeLayer", () => {
  it("renders each bridge as its own depth-sortable svg layer", () => {
    const { bridges, viewBox } = resolveUniverseMap();
    const html = renderToStaticMarkup(
      <MapBridgeLayer bridges={bridges} viewBox={viewBox} paused={false} />,
    );

    for (const bridge of bridges) {
      expect(html).toContain(bridge.d);
      expect(html).toContain(`z-index:${mapDepthZ(bridge.depthY, "bridge")}`);
    }
  });
});
