import { describe, expect, it } from "vitest";
import { MAP_STAGE } from "@/data/universe-zones";
import {
  advanceDistance,
  computeFrame,
  pickDir,
  pickFlip,
  type RoamerSim,
} from "./useRoamerSim";

describe("pickFlip（左右朝向遲滯）", () => {
  it("明顯左移用基準圖（face-left，flip=1）", () => {
    expect(pickFlip(-5, -1)).toBe(1);
  });

  it("明顯右移鏡像（flip=-1）", () => {
    expect(pickFlip(5, 1)).toBe(-1);
  });

  it("切線近零時維持原朝向（避免抖動）", () => {
    expect(pickFlip(0.2, -1)).toBe(-1);
    expect(pickFlip(-0.2, 1)).toBe(1);
  });
});

describe("pickDir（前後朝向遲滯）", () => {
  it("向下（朝觀者）→ front", () => {
    expect(pickDir(5, "rear")).toBe("front");
  });

  it("向上（遠離）→ rear", () => {
    expect(pickDir(-5, "front")).toBe("rear");
  });

  it("垂直分量近零時維持原朝向", () => {
    expect(pickDir(0.3, "rear")).toBe("rear");
    expect(pickDir(-0.3, "front")).toBe("front");
  });
});

function makeSim(distance: number, bankDeg = 0): RoamerSim {
  return {
    roamer: {
      id: "map-roamer",
      characterId: "test",
      routeId: "map-test",
      speed: 10,
      src: "/front.png",
    },
    distance,
    direction: 1,
    route: {
      length: 400,
      pingpong: false,
      el: {
        getPointAtLength: (d: number) => ({ x: 500, y: d }),
      } as SVGPathElement,
    },
    phase: 0,
    flip: 1,
    dir: "rear",
    angle: 0,
    bankDeg,
    pausedUntil: 0,
  };
}

describe("computeFrame（map 層 2.5D frame）", () => {
  it("computes direction, shadow and depth scale in stage coordinates", () => {
    const sim = makeSim(200);
    const frame = computeFrame(sim, MAP_STAGE.height, 16, 1000, "map");

    expect(frame.dir).toBe("front");
    expect(frame.depthScale).toBeGreaterThan(0.9);
    expect(frame.shadowScale).toBeGreaterThan(0);
    expect(frame.z).toBe(200);
  });

  it("map 空間關閉 bob 與 bank", () => {
    const sim = makeSim(200, 3);
    const frame = computeFrame(sim, MAP_STAGE.height, 16, 1000, "map");
    expect(frame.bobPx).toBe(0);
    expect(frame.bankDeg).toBe(0);
    expect(sim.bankDeg).toBe(0);
  });

  it("tile 空間保留 bob", () => {
    const sim = makeSim(200);
    const frame = computeFrame(sim, 260, 16, 1000, "tile");
    expect(frame.bobPx).not.toBe(0);
  });
});

describe("advanceDistance", () => {
  function simFor(route: { length: number; pingpong: boolean }): RoamerSim {
    return {
      roamer: {
        id: "r",
        characterId: "xiao-hong",
        routeId: "route",
        speed: 10,
        src: "/r.png",
      },
      distance: 95,
      direction: 1,
      route: {
        ...route,
        el: {
          getPointAtLength: (d: number) => ({ x: d, y: d }),
        } as SVGPathElement,
      },
      phase: 0,
      flip: 1,
      dir: "front",
      angle: 0,
      bankDeg: 0,
      pausedUntil: 0,
    };
  }

  it("wrap route 超過終點後從頭接續", () => {
    const sim = simFor({ length: 100, pingpong: false });
    advanceDistance(sim, 1000, 0);
    expect(sim.distance).toBe(5);
  });

  it("pingpong route 到終點後反向", () => {
    const sim = simFor({ length: 100, pingpong: true });
    advanceDistance(sim, 1000, 0);
    expect(sim.distance).toBe(100);
    expect(sim.direction).toBe(-1);
  });

  it("暫停期間不前進", () => {
    const sim = simFor({ length: 100, pingpong: false });
    sim.pausedUntil = 2000;
    advanceDistance(sim, 1000, 1000);
    expect(sim.distance).toBe(95);
  });
});
