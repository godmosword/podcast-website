import { describe, expect, it } from "vitest";
import { ZONES } from "@/data/universe-zones";
import { islandTileOrigin, tileLocalToStage } from "./roamer-coords";

describe("roamer-coords", () => {
  const carPark = ZONES.find((z) => z.id === "car-park")!;
  const zonePx = { x: carPark.coord.x, y: carPark.coord.y };

  it("car-park island tile origin 對齊 anchorUV（weenie hero box 330×325）", () => {
    expect(islandTileOrigin("car-park", zonePx)).toEqual({
      left: 335,
      top: 127,
      w: 330,
      h: 325,
    });
  });

  it("car-park 步道 M 起點映射至 stage（hero tile 90,245）", () => {
    expect(tileLocalToStage("car-park", { x: 90, y: 245 }, zonePx)).toEqual({
      x: 425,
      y: 372,
    });
  });

  it("car-park 步道右緣點映射至 stage（hero tile 315,235）", () => {
    expect(tileLocalToStage("car-park", { x: 315, y: 235 }, zonePx)).toEqual({
      x: 650,
      y: 362,
    });
  });
});
