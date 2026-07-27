// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mapDepthZ } from "@/lib/universe-depth";
import { resolveUniverseMap } from "@/lib/universe-map";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
import ZoneIsland from "./ZoneIsland";

vi.stubGlobal("React", React);

// jsdom 沒有 SVGGeometryElement.getTotalLength；島上漫遊車的路徑量測會炸。
// 本檔只驗泡泡的 DOM 位置／層深，漫遊層直接停用。
vi.mock("./IslandRoamerLayer", () => ({ default: () => null }));

const dino = resolveUniverseMap().zones.find((z) => z.id === "dino")!;

function renderDino() {
  return render(
    <ZoneIsland
      zone={dino}
      onActivate={() => undefined}
      reduced
      paused={false}
      night={false}
    />,
  );
}

describe("ZoneIsland 鎖島泡泡", () => {
  afterEach(cleanup);

  it("點鎖島後泡泡在島 button 之外（button 有 z-index 自成 stacking context）", () => {
    const { container } = renderDino();
    fireEvent.click(screen.getByRole("button", { name: /恐龍島，建造中/ }));

    const bubble = screen.getByText("還在蓋喔！");
    const button = container.querySelector("button")!;

    expect(button.contains(bubble)).toBe(false);
  });

  it("泡泡層深走 bubble band（高於島名木牌與探索點）", () => {
    const { container } = renderDino();
    fireEvent.click(screen.getByRole("button", { name: /恐龍島，建造中/ }));

    const anchor = screen.getByText("還在蓋喔！").parentElement!;
    const z = Number(anchor.style.zIndex);

    expect(z).toBe(mapDepthZ(dino.depthY, "bubble"));
    expect(z).toBeGreaterThan(mapDepthZ(dino.depthY, "label"));
    // 定位在 tile box 頂緣（沙岸錨點往上 ay × 島高），不再壓在島身上
    const tile = getZoneArtTile("dino");
    if (tile.mode !== "island") throw new Error("dino 應為 island tile");
    expect(anchor.style.top).toBe(
      `${dino.px.y - tile.anchorUV[1] * tile.stageSize.h}px`,
    );
    expect(container).toBeTruthy();
  });

  it("開放島點擊不出泡泡", () => {
    const carPark = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    render(
      <ZoneIsland
        zone={carPark}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /車車樂園，開放中/ }));

    expect(screen.queryByText("還在蓋喔！")).toBeNull();
  });
});
