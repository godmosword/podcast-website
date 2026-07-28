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

  /**
   * 別把這幾個 svg 合併成一個。每座橋各自帶 z-index 才能在 2.5D 舞台上與島**交錯**：
   * 同一座橋要能在遠島之前、近島之後。合成單一 svg ⇒ 只剩一個 z-index ⇒ 全部橋
   * 一起掉到某一層，該穿到遠島前面的橋會被遠島蓋掉。
   */
  it("keeps one svg per bridge so bridges interleave with islands, not batch behind them", () => {
    const { bridges, zones } = resolveUniverseMap();
    const html = renderToStaticMarkup(
      <MapBridgeLayer
        bridges={bridges}
        viewBox={resolveUniverseMap().viewBox}
        paused={false}
      />,
    );
    expect(html.match(/<svg/g)).toHaveLength(bridges.length);

    const bridgeZ = bridges.map((b) => mapDepthZ(b.depthY, "bridge"));
    const islandZ = zones.map((z) => mapDepthZ(z.depthY, "island"));
    // 真的有交錯：至少一座橋在某島之前、又在另一島之後。
    expect(
      bridgeZ.some(
        (bz) => islandZ.some((iz) => iz < bz) && islandZ.some((iz) => iz > bz),
      ),
    ).toBe(true);
  });
});
