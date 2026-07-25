import { describe, expect, it } from "vitest";
import { ZONES } from "@/data/universe-zones";
import { islandTileOrigin, tileLocalToStage } from "./roamer-coords";

describe("roamer-coords", () => {
  const carPark = ZONES.find((z) => z.id === "car-park")!;
  const zonePx = { x: carPark.coord.x, y: carPark.coord.y };

  it("car-park island tile origin 對齊 anchorUV（weenie hero box 330×325）", () => {
    // 新座標 (410,495)：left=410-0.5*330=245、top=495-0.84*325=222
    expect(islandTileOrigin("car-park", zonePx)).toEqual({
      left: 245,
      top: 222,
      w: 330,
      h: 325,
    });
  });

  it("car-park 步道 M 起點映射至 stage（hero tile 90,245）", () => {
    expect(tileLocalToStage("car-park", { x: 90, y: 245 }, zonePx)).toEqual({
      x: 335,
      y: 467,
    });
  });

  it("car-park 步道右緣點映射至 stage（hero tile 315,235）", () => {
    expect(tileLocalToStage("car-park", { x: 315, y: 235 }, zonePx)).toEqual({
      x: 560,
      y: 457,
    });
  });
});
