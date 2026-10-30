import { describe, expect, it } from "vitest";
import { PASS_DURATION } from "@/lib/games/orange-express/reducer";
import {
  PASS_FAR,
  PASS_LENGTH,
  PLATFORM_TOP,
  SIGNAL_WORLD,
  STATION_WORLD,
  cameraTravel,
  drawWindshield,
  passingNose,
  portalVisible,
  signBars,
  signCells,
  LANDMARK_AHEAD,
  landmarkBox,
  postScreenBox,
  stopPostWorld,
  treeVisible,
  viewFor,
  windshieldFrame,
} from "@/lib/games/orange-express/windshield";
import { PLATFORM_TASK_LEAD, SIGNAL_UNTIL, stationsFor } from "@/lib/games/orange-express/routes";
import type { Phase } from "@/lib/games/orange-express/types";

const PHASES: Phase[] = ["running", "in-window", "stopped", "doors-open", "reversing", "route-done"];

describe("前窗", () => {
  it("減少動態時只有三格；出發號誌題過後，相機只停在三個位置", () => {
    const seen = new Set<number>();
    for (const phase of PHASES) {
      for (const progress of [0.2, 0.5, 0.9, 1]) {
        const frame = windshieldFrame(progress, phase);
        expect([0, 1, 2]).toContain(frame);
        seen.add(cameraTravel(true, progress, phase, 0.65));
      }
    }
    expect(seen.size).toBe(3);
  });

  it("停好時相機剛好在停車目標", () => {
    expect(cameraTravel(true, 0.6, "stopped", 0.65)).toBeCloseTo(0.65 * STATION_WORLD);
  });

  it("一般動態跟著進度連續走", () => {
    expect(cameraTravel(false, 0.2, "running", 0.65)).toBeCloseTo(0.2 * STATION_WORLD);
    expect(cameraTravel(false, 0.21, "running", 0.65)).toBeGreaterThan(cameraTravel(false, 0.2, "running", 0.65));
  });
});

describe("前窗：隧道、鐵橋、速限牌、對向列車", () => {
  it("減少動態時在隧道或鐵橋上，相機停在那一段的中間，不跟著進度走", () => {
    const tunnel = { from: 0.1, to: 0.18 };
    const a = cameraTravel(true, 0.11, "running", 0.65, { tunnel });
    const b = cameraTravel(true, 0.17, "running", 0.65, { tunnel });
    expect(a).toBe(b);
    expect(a).toBeCloseTo(0.14 * STATION_WORLD);
    expect(cameraTravel(true, 0.3, "running", 0.65, { tunnel })).toBeCloseTo(0.28 * STATION_WORLD);
  });

  it("對向列車從遠方靠近，最後整列都過去", () => {
    expect(passingNose(0)).toBe(PASS_FAR);
    expect(passingNose(1)).toBeLessThan(passingNose(0.5));
    expect(passingNose(PASS_DURATION) + PASS_LENGTH).toBeLessThanOrEqual(0.001);
  });

  it("速限牌亮幾格：快 3、中 2、慢 1", () => {
    expect(signBars(0.82)).toBe(3);
    expect(signBars(0.55)).toBe(2);
    expect(signBars(0.35)).toBe(1);
  });

  it("速限牌永遠三個等高格子，亮幾格就是多快，整組在牌面裡置中", () => {
    for (const bars of [1, 2, 3] as const) {
      const cells = signCells(bars);
      expect(cells).toHaveLength(3);
      expect(new Set(cells.map((cell) => cell.h)).size).toBe(1);
      expect(cells.filter((cell) => cell.lit)).toHaveLength(bars);
      const left = cells[0]!.x;
      const right = cells[2]!.x + cells[2]!.w;
      expect(left + right).toBeCloseTo(0);
      for (const cell of cells) {
        expect(Math.hypot(Math.max(Math.abs(cell.x), Math.abs(cell.x + cell.w)), cell.h / 2)).toBeLessThan(0.74);
      }
    }
  });

  it("三種背景與隧道內外、鐵橋、對向列車都畫得出來，而且不畫字", () => {
    const calls: string[] = [];
    const gradient = { addColorStop: () => {} };
    const ctx = new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === "createLinearGradient") return () => gradient;
          return () => {
            calls.push(prop);
          };
        },
        set() {
          return true;
        },
      },
    ) as unknown as CanvasRenderingContext2D;
    const signs = [{ at: 0.06, limit: 0.55 }];
    for (const scene of ["field", "city", "sea"] as const) {
      for (const progress of [0.02, 0.09, 0.14, 0.2]) {
        drawWindshield(ctx, 480, 270, {
          progress,
          phase: "running",
          reduced: false,
          target: 0.65,
          scene,
          tunnel: { from: 0.1, to: 0.18 },
          bridge: { from: 0.19, to: 0.25 },
          signs,
          passing: 1.6,
        });
      }
    }
    expect(calls).toContain("fill");
    expect(calls).toContain("clip");
    expect(calls).not.toContain("fillText");
    expect(calls).not.toContain("drawImage");
  });
});

type Fill = { color: string; pts: { x: number; y: number }[] };

/** 記下每次 fill 的顏色與路徑點，看月台畫到哪裡。 */
function recordFills(): { ctx: CanvasRenderingContext2D; fills: Fill[] } {
  const fills: Fill[] = [];
  let pts: Fill["pts"] = [];
  let color = "";
  const gradient = { addColorStop: () => {} };
  const ctx = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "createLinearGradient") return () => gradient;
        if (prop === "beginPath") return () => (pts = []);
        if (prop === "moveTo" || prop === "lineTo") return (x: number, y: number) => pts.push({ x, y });
        if (prop === "fill") return () => fills.push({ color, pts });
        return () => {};
      },
      set(_target, prop: string, value: unknown) {
        if (prop === "fillStyle") color = String(value);
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, fills };
}

describe("前窗：月台", () => {
  it("停好時月台頂面鋪到前窗下緣，近端不會被切在畫面中段", () => {
    for (const [w, h] of [
      [364, 183],
      [1960, 270],
    ] as const) {
      const { ctx, fills } = recordFills();
      drawWindshield(ctx, w, h, { progress: 0.65, phase: "stopped", reduced: true, target: 0.65 });
      const top = fills.filter((fill) => fill.color === PLATFORM_TOP);
      expect(top.length).toBeGreaterThan(0);
      const lowest = Math.max(...top.flatMap((fill) => fill.pts.map((p) => p.y)));
      expect(lowest).toBeGreaterThanOrEqual(h);
    }
  });
});

describe("前窗：停車柱與門形線柱", () => {
  it("每一檔每一站，停車柱前後 12 公尺內都沒有門形線柱，不會疊成雙桿", () => {
    for (const level of ["look", "drive", "captain"] as const) {
      for (const driver of ["little", "big"] as const) {
        for (const station of stationsFor(level, driver)) {
          const post = stopPostWorld(station.target);
          for (let portal = 0; portal <= STATION_WORLD; portal += 50) {
            if (Math.abs(portal - post) <= 12) expect(portalVisible(portal, post)).toBe(false);
            else expect(portalVisible(portal, post)).toBe(true);
          }
        }
      }
    }
    // 目標 0.65 時停車柱在 399 公尺，400 公尺那一座要拿掉。
    expect(portalVisible(400, stopPostWorld(0.65))).toBe(false);
    expect(portalVisible(350, stopPostWorld(0.65))).toBe(true);
  });
});

describe("前窗：指差確認的東西要看得到（B19）", () => {
  const pointingStations = (["drive", "captain"] as const).flatMap((level) => stationsFor(level, "big"));

  it("號誌題整段，出發號誌都在前窗裡；減少動態時停在起點", () => {
    expect(pointingStations.length).toBeGreaterThan(0);
    for (const station of pointingStations) {
      const task = station.points.find((p) => p.kind === "signal")!;
      expect(task.until).toBe(SIGNAL_UNTIL);
      for (const progress of [task.at, task.until]) {
        const z = SIGNAL_WORLD - cameraTravel(false, progress, "running", station.target);
        expect(z).toBeGreaterThan(10);
        expect(z).toBeLessThan(40);
      }
    }
    expect(cameraTravel(true, 0, "running", 0.65)).toBe(0);
    expect(cameraTravel(true, SIGNAL_UNTIL - 0.001, "running", 0.65)).toBe(0);
    expect(cameraTravel(true, SIGNAL_UNTIL + 0.01, "running", 0.65)).toBeCloseTo(0.28 * STATION_WORLD);
  });

  it("月台題出來時，月台近端已經在八公尺內", () => {
    for (const station of pointingStations) {
      const task = station.points.find((p) => p.kind === "platform")!;
      const nearEnd = station.target * STATION_WORLD - 70 - task.at * STATION_WORLD;
      expect(nearEnd).toBeLessThanOrEqual(8.001);
      expect(task.at).toBeGreaterThanOrEqual(station.approachAt);
      expect(task.at).toBeCloseTo(Math.max(station.approachAt, station.target - PLATFORM_TASK_LEAD));
      expect(task.until).toBeGreaterThan(task.at + 0.1);
    }
  });

  it("出發時畫亮綠燈的號誌（前面有隧道口也不會被蓋掉），開遠了就不畫", () => {
    const go = "rgb(96, 214, 120)";
    const start = recordFills();
    drawWindshield(start.ctx, 480, 270, {
      progress: 0,
      phase: "running",
      reduced: false,
      target: 0.65,
      tunnel: { from: 0.1, to: 0.18 },
    });
    const lastGo = start.fills.map((fill) => fill.color).lastIndexOf(go);
    const lastTunnel = start.fills.map((fill) => fill.color).lastIndexOf("rgb(46, 42, 56)");
    expect(lastGo).toBeGreaterThan(-1);
    expect(lastGo).toBeGreaterThan(lastTunnel);
    // 沒有隧道的站：門形線柱與架空線比號誌遠，號誌要畫在它們後面（線不能從綠燈上劃過）。
    const open = recordStrokes();
    drawWindshield(open.ctx, 480, 270, { progress: 0.02, phase: "running", reduced: false, target: 0.65 });
    expect(open.events.lastIndexOf("fill:" + go)).toBeGreaterThan(open.events.lastIndexOf("stroke"));
    const later = recordFills();
    drawWindshield(later.ctx, 480, 270, { progress: 0.2, phase: "running", reduced: false, target: 0.65 });
    expect(later.fills.some((fill) => fill.color === go)).toBe(false);
  });
});

/** 依序記下 fill（含顏色）與 stroke，看誰畫在誰上面。 */
function recordStrokes(): { ctx: CanvasRenderingContext2D; events: string[] } {
  const events: string[] = [];
  let color = "";
  const gradient = { addColorStop: () => {} };
  const ctx = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "createLinearGradient") return () => gradient;
        if (prop === "fill") return () => events.push(`fill:${color}`);
        if (prop === "stroke") return () => events.push("stroke");
        return () => {};
      },
      set(_target, prop: string, value: unknown) {
        if (prop === "fillStyle") color = String(value);
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, events };
}

describe("前窗：路旁樹叢的禁區", () => {
  const base = { targetWorld: 0.65 * STATION_WORLD, scene: "field" as const, tunnel: null, bridge: null };

  it("太近不畫（高速時大樹不會一閃一閃）、太遠不畫", () => {
    expect(treeVisible({ ...base, side: 1, world: 100, z: 6 })).toBe(false);
    expect(treeVisible({ ...base, side: -1, world: 100, z: 40 })).toBe(true);
    expect(treeVisible({ ...base, side: -1, world: 100, z: 400 })).toBe(false);
  });

  it("月台那一段左邊不畫；右下指差確認鈕那塊（右邊太近）不畫", () => {
    expect(treeVisible({ ...base, side: -1, world: base.targetWorld - 20, z: 40 })).toBe(false);
    expect(treeVisible({ ...base, side: 1, world: 100, z: 40 })).toBe(true);
    expect(treeVisible({ ...base, side: 1, world: 100, z: 14 })).toBe(false);
    // 地標那一側：站前一整段都不生樹，進站時遠遠就看得到地標。
    expect(treeVisible({ ...base, side: 1, world: base.targetWorld - 120, z: 40 })).toBe(false);
  });

  it("城市有房子、海邊右邊是海、隧道與鐵橋那段都不畫", () => {
    expect(treeVisible({ ...base, scene: "city", side: -1, world: 100, z: 40 })).toBe(false);
    expect(treeVisible({ ...base, scene: "sea", side: 1, world: 100, z: 40 })).toBe(false);
    expect(treeVisible({ ...base, scene: "sea", side: -1, world: 100, z: 40 })).toBe(true);
    expect(treeVisible({ ...base, tunnel: { from: 0.1, to: 0.18 }, side: -1, world: 80, z: 40 })).toBe(false);
    expect(treeVisible({ ...base, bridge: { from: 0.1, to: 0.19 }, side: 1, world: 80, z: 40 })).toBe(false);
  });
});

describe("前窗：站點地標", () => {
  const W = 390;
  const H = 330;
  const target = 0.65;
  const targetWorld = target * STATION_WORLD;

  it("每站一個地標：遊樂園摩天輪、橘子坡橘子大樹、回家紅屋頂小房子", () => {
    expect(stationsFor("drive", "big").map((s) => s.landmark)).toEqual(["ferris", "orange-tree", "house"]);
    expect(stationsFor("look").map((s) => s.landmark)).toEqual(["house"]);
  });

  it("停好時地標在月台另一側（右邊）、提示條下面、指差確認鈕上面，約前窗六分之一寬", () => {
    const view = viewFor(W, H);
    const box = landmarkBox(view, targetWorld, targetWorld, "field", "ferris")!;
    expect(box.left).toBeGreaterThan(W / 2);
    expect(box.right).toBeLessThanOrEqual(W);
    expect(box.top).toBeGreaterThan(50);
    expect(box.bottom).toBeLessThan(H - 16 - 56);
    expect(box.right - box.left).toBeGreaterThan(W / 8);
    expect(box.right - box.left).toBeLessThan(W / 4);
  });

  it("回家站右邊是海：小房子放左邊陸地上，不疊到停車柱", () => {
    const view = viewFor(W, H);
    const box = landmarkBox(view, targetWorld, targetWorld, "sea", "house")!;
    expect(box.right).toBeLessThan(W / 2);
    const post = postScreenBox(view, targetWorld, target);
    expect(box.right).toBeLessThan(post.left);
  });

  it("地標比停車點遠，一出發在地平線上就小小地看得到；開過了就不畫", () => {
    const view = viewFor(W, H);
    const far = landmarkBox(view, 20, targetWorld, "field", "ferris")!;
    expect(far.right - far.left).toBeGreaterThan(0);
    expect(far.right - far.left).toBeLessThan(20);
    expect(landmarkBox(view, targetWorld + LANDMARK_AHEAD, targetWorld, "field", "ferris")).toBeNull();
  });

  it("地標那一帶不畫路旁樹（海邊是左邊）", () => {
    const base = { targetWorld, tunnel: null, bridge: null, z: 40 };
    expect(treeVisible({ ...base, scene: "field", side: 1, world: targetWorld + LANDMARK_AHEAD })).toBe(false);
    expect(treeVisible({ ...base, scene: "sea", side: -1, world: targetWorld + LANDMARK_AHEAD })).toBe(false);
  });
});
