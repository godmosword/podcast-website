import { describe, expect, it } from "vitest";
import { loadEpisodeBoard } from "@/lib/episode-board";
import {
  actorHitGap,
  bounceHeight,
  characterFootprint,
  createTownAgents,
  eyesClosed,
  findPath,
  hasOverlap,
  isRoad,
  MIN_HIT_GAP,
  occupiedCells,
  paradeCells,
  piecesForFrame,
  sortByDepth,
  splitFootprint,
  stepTown,
  TOWN_PROPS,
  type DepthPiece,
} from "@/lib/episode-board-grid";

const PHONE = { width: 390, height: 640 };
const DESKTOP = { width: 1280, height: 720 };

describe("episode board grid", () => {
  it("繞開被擋住的路，不會踩進障礙", () => {
    expect(findPath({ x: 1, y: 1 }, { x: 1, y: 1 })).toEqual([]);
    expect(findPath({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
    expect(findPath({ x: 1, y: 1 }, { x: 3, y: 1 }, new Set(["3,1"]))).toBeNull();

    const blocked = new Set(["2,1"]);
    const path = findPath({ x: 1, y: 1 }, { x: 3, y: 1 }, blocked);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(1);
    expect(path![path!.length - 1]).toEqual({ x: 3, y: 1 });
    for (const cell of path!) {
      expect(isRoad(cell.x, cell.y), `${cell.x},${cell.y}`).toBe(true);
      expect(blocked.has(`${cell.x},${cell.y}`)).toBe(false);
    }
  });

  it("車道跟建物、池塘不重疊", () => {
    const parade = new Set(paradeCells().map((cell) => `${cell.x},${cell.y}`));
    for (const cell of paradeCells()) {
      expect(isRoad(cell.x, cell.y), `${cell.x},${cell.y}`).toBe(true);
    }
    for (const prop of TOWN_PROPS) {
      for (let y = 0; y < prop.h; y += 1) {
        for (let x = 0; x < prop.w; x += 1) {
          expect(parade.has(`${prop.x + x},${prop.y + y}`)).toBe(false);
        }
      }
    }
  });

  it("十二台車走很久也不會佔到同一格", () => {
    let agents = createTownAgents(loadEpisodeBoard().actors);
    expect(agents).toHaveLength(12);
    for (let frame = 0; frame < 360; frame += 1) {
      agents = stepTown(agents, 1 / 30, { reduced: false, allowMove: frame % 80 < 48 });
      expect(hasOverlap(agents)).toBe(false);
    }
    const parked = stepTown(agents, 0.2, { reduced: true, allowMove: true });
    expect(parked.every((agent) => agent.toward === null && agent.progress === 0)).toBe(true);
    expect(hasOverlap(parked)).toBe(false);
  });

  it("下一格被佔住就整隊停，一次最多走一格", () => {
    const piled = createTownAgents(
      [
        { id: "a", character: "duo-duo" },
        { id: "b", character: "xiao-hong" },
      ],
      [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
    );
    const held = stepTown(piled, 0.4, { reduced: false, allowMove: true });
    expect(hasOverlap(held)).toBe(false);
    expect(held[0]).toMatchObject({ leg: 0, toward: null, progress: 0 });
    expect(held[1]).toMatchObject({ leg: 0, toward: null, progress: 0 });

    const cast = createTownAgents(loadEpisodeBoard().actors);
    const jumped = stepTown(cast, 5, { reduced: false, allowMove: true });
    expect(hasOverlap(jumped)).toBe(false);
    expect(jumped.every((agent) => agent.leg === 1 && agent.toward === null)).toBe(true);
  });

  it("手機與桌面的點擊範圍至少隔 8px，彈跳時也是", () => {
    let agents = createTownAgents(loadEpisodeBoard().actors);
    for (const view of [PHONE, DESKTOP, { width: 390, height: 844 }]) {
      expect(actorHitGap(agents, view, 0, true)).toBeGreaterThanOrEqual(MIN_HIT_GAP);
    }
    for (let frame = 0; frame < 90; frame += 1) {
      agents = stepTown(agents, 1 / 30, { reduced: false, allowMove: true });
      expect(hasOverlap(agents)).toBe(false);
      expect(actorHitGap(agents, PHONE, frame / 30, false)).toBeGreaterThanOrEqual(MIN_HIT_GAP);
    }
  });

  it("多格房子拆開後由遠到近，車可以排在前後兩格中間", () => {
    const house = splitFootprint("house", { x: 2, y: 2 }, 2, 2);
    expect(house).toHaveLength(4);
    const car: DepthPiece = {
      id: "car",
      propId: "",
      gx: 3.2,
      gy: 2.4,
      lx: 0,
      ly: 0,
      kind: "car",
    };
    const sorted = sortByDepth([...house, car]);
    const keys = sorted.map((piece) => piece.gx + piece.gy);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    const back = sorted.findIndex((piece) => piece.gx === 2 && piece.gy === 2);
    const mid = sorted.findIndex((piece) => piece.id === "car");
    const front = sorted.findIndex((piece) => piece.gx === 3 && piece.gy === 3);
    expect(back).toBeLessThan(mid);
    expect(mid).toBeLessThan(front);

    const frame = piecesForFrame(createTownAgents(loadEpisodeBoard().actors));
    const frameKeys = frame.map((piece) => piece.gx + piece.gy);
    expect(frameKeys).toEqual([...frameKeys].sort((a, b) => a - b));
  });

  it("巴士和賽車佔兩格，恐龍車和機器人才佔一格，多出來的格子也在路上", () => {
    const agents = createTownAgents(loadEpisodeBoard().actors);
    const bus = agents.find((agent) => agent.character === "lan-ba-shi");
    const racer = agents.find((agent) => agent.character === "xiao-hong");
    const dino = agents.find((agent) => agent.character === "duo-duo");
    const robot = agents.find((agent) => agent.character === "watt");
    expect(bus && occupiedCells(bus)).toHaveLength(2);
    expect(racer && occupiedCells(racer)).toHaveLength(2);
    expect(dino && occupiedCells(dino)).toHaveLength(1);
    expect(robot && occupiedCells(robot)).toHaveLength(1);
    expect(characterFootprint("lan-ba-shi")).toHaveLength(2);
    for (const agent of agents) {
      for (let leg = 0; leg < 4; leg += 1) {
        const parked = { ...agent, leg, toward: null, progress: 0 };
        for (const cell of occupiedCells(parked)) {
          expect(isRoad(cell.x, cell.y), `${agent.character} ${cell.x},${cell.y}`).toBe(true);
        }
      }
    }
  });

  it("減少動態時不跳也不眨眼，尋路模擬夠快", () => {
    expect(bounceHeight(0.4, 1, true, true)).toBe(0);
    expect(bounceHeight(0.4, 1, false, true)).toBeGreaterThan(0);
    expect(eyesClosed(3.5, 0, false)).toBe(true);
    expect(eyesClosed(3.5, 0, true)).toBe(false);
    expect(eyesClosed(0, 2, false)).toBe(false);

    let agents = createTownAgents(loadEpisodeBoard().actors);
    const started = performance.now();
    const frames = 180;
    for (let frame = 0; frame < frames; frame += 1) {
      agents = stepTown(agents, 1 / 30, { reduced: false, allowMove: true });
    }
    expect((performance.now() - started) / frames).toBeLessThan(4);
    expect(hasOverlap(agents)).toBe(false);
  });
});
