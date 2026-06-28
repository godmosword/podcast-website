import { describe, expect, it } from "vitest";
import { ZONES } from "@/data/universe-zones";
import { islandTileOrigin, tileLocalToStage } from "./roamer-coords";

describe("roamer-coords", () => {
  const carPark = ZONES.find((z) => z.id === "car-park")!;
  const zonePx = { x: carPark.coord.x, y: carPark.coord.y };

  it("car-park island tile origin 對齊 anchorUV", () => {
    expect(islandTileOrigin("car-park", zonePx)).toEqual({
      left: 368,
      top: 181.6,
      w: 264,
      h: 260,
    });
  });

  it("car-park 步道 M 起點映射至 stage（tile 72,188）", () => {
    expect(tileLocalToStage("car-park", { x: 72, y: 188 }, zonePx)).toEqual({
      x: 440,
      y: 369.6,
    });
  });

  it("car-park 步道終點映射至 stage（tile 252,188）", () => {
    expect(tileLocalToStage("car-park", { x: 252, y: 188 }, zonePx)).toEqual({
      x: 620,
      y: 369.6,
    });
  });
});
