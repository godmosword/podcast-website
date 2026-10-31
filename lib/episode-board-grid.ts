/**
 * 角色看板的佔位格網：道路才走得過，A* 尋路，移動前先預約下一格。
 * 十二台車排成間距 3 的隊伍一起走，相對位置不變，手機上的 48px 按鈕才不會貼在一起。
 * 深度鍵是格子的 gx+gy。多格建物拆成一格一格排，跟車放在同一個排序裡。
 */

export const HIT_SIZE = 48;
export const MIN_HIT_GAP = 8;
/** 按鈕抬到車頭附近，每台車用同一個高度，間距不會因為這層位移改變。 */
export const BUTTON_LIFT = 0.95;
export const Z_PER_TW = 1.15;

export type Cell = { x: number; y: number };

export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

function add(a: Cell, b: Cell): Cell {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** 隊伍每次只平移一格，四步繞一小圈，十二台的相對位置始終一樣。 */
export const PARADE_OFFSETS: readonly Cell[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

/**
 * 跟 `data/episode-board.json` 的順序對上：
 * 多多、小紅（旁邊是紅綠燈）、灰灰、阿酷、香香、猛猛、安安、東東（旁邊是工地）、
 * 吊車、鈴鈴、藍巴士、沃特。
 */
export const TOWN_HOMES: readonly Cell[] = [
  { x: 4, y: 7 },
  { x: 7, y: 7 },
  { x: 10, y: 7 },
  { x: 1, y: 1 },
  { x: 1, y: 4 },
  { x: 4, y: 4 },
  { x: 7, y: 4 },
  { x: 10, y: 4 },
  { x: 1, y: 7 },
  { x: 4, y: 1 },
  { x: 7, y: 1 },
  { x: 10, y: 1 },
];

/** 長車往 +x 再佔一格。恐龍車和機器人維持一格，輪廓才不會一樣長。 */
export function characterFootprint(character: string): readonly Cell[] {
  if (character === "duo-duo" || character === "watt" || character === "dong-dong") {
    return [{ x: 0, y: 0 }];
  }
  return [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ];
}

export type TownPropKind = "house" | "tree" | "light" | "dirt" | "barrier" | "bench" | "flower";

export type TownProp = {
  id: string;
  kind: TownPropKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 屋頂用哪種粉彩色。房子以外用不到。 */
  roof?: "pink" | "brand" | "yellow";
};

export const TOWN_PROPS: readonly TownProp[] = [
  { id: "house-back", kind: "house", x: 3, y: 0, w: 2, h: 1, roof: "pink" },
  { id: "house-front", kind: "house", x: 8, y: 9, w: 2, h: 1, roof: "brand" },
  { id: "house-side", kind: "house", x: 0, y: 2, w: 1, h: 2, roof: "yellow" },
  { id: "tree-park", kind: "tree", x: 3, y: 3, w: 1, h: 1 },
  { id: "tree-shade", kind: "tree", x: 6, y: 6, w: 1, h: 1 },
  { id: "tree-edge", kind: "tree", x: 12, y: 3, w: 1, h: 1 },
  { id: "tree-gate", kind: "tree", x: 0, y: 6, w: 1, h: 1 },
  { id: "tree-back", kind: "tree", x: 6, y: 0, w: 1, h: 1 },
  { id: "flower-park", kind: "flower", x: 3, y: 6, w: 1, h: 1 },
  { id: "flower-front", kind: "flower", x: 6, y: 9, w: 1, h: 1 },
  { id: "bench", kind: "bench", x: 5, y: 6, w: 1, h: 1 },
  { id: "dirt", kind: "dirt", x: 2, y: 9, w: 1, h: 1 },
  { id: "barrier", kind: "barrier", x: 4, y: 9, w: 1, h: 1 },
  { id: "light", kind: "light", x: 12, y: 5, w: 1, h: 1 },
];

export const TOWN_PONDS: readonly Cell[] = [{ x: 6, y: 3 }];

const PROP_CELLS = new Set<string>();
for (const prop of TOWN_PROPS) {
  for (let y = 0; y < prop.h; y += 1) {
    for (let x = 0; x < prop.w; x += 1) PROP_CELLS.add(`${prop.x + x},${prop.y + y}`);
  }
}
const POND_CELLS = new Set(TOWN_PONDS.map(cellKey));

function streetVisual(x: number, y: number): boolean {
  if (x < 1 || x > 12 || y < 1 || y > 8) return false;
  if (y === 1 || y === 2 || y === 4 || y === 5 || y === 7 || y === 8) return true;
  return x === 1 || x === 2 || x === 4 || x === 5 || x === 7 || x === 8 || x === 10 || x === 11 || x === 12;
}

const ROAD = new Set<string>();
for (let y = 0; y <= 9; y += 1) {
  for (let x = 0; x <= 12; x += 1) {
    if (!streetVisual(x, y)) continue;
    const key = `${x},${y}`;
    if (PROP_CELLS.has(key) || POND_CELLS.has(key)) continue;
    ROAD.add(key);
  }
}

export function isRoad(x: number, y: number): boolean {
  return ROAD.has(`${x},${y}`);
}

export type GroundKind = "pond" | "road" | "grass" | "none";

export function groundKind(x: number, y: number): GroundKind {
  if (x < 0 || y < 0 || x > 12 || y > 9) return "none";
  if (POND_CELLS.has(`${x},${y}`)) return "pond";
  if (streetVisual(x, y)) return "road";
  return "grass";
}

export function paradeCells(): Cell[] {
  const cells: Cell[] = [];
  for (const home of TOWN_HOMES) {
    for (const offset of PARADE_OFFSETS) cells.push(add(home, offset));
  }
  return cells;
}

const DIRS: Cell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function findPath(
  start: Cell,
  goal: Cell,
  blocked: ReadonlySet<string> = new Set(),
): Cell[] | null {
  if (!isRoad(start.x, start.y) || !isRoad(goal.x, goal.y)) return null;
  if (blocked.has(cellKey(goal))) return null;
  if (sameCell(start, goal)) return [];
  const startKey = cellKey(start);
  const goalKey = cellKey(goal);
  const open: string[] = [startKey];
  const came = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, heuristic(start, goal)]]);
  const closed = new Set<string>();

  while (open.length > 0) {
    let best = 0;
    for (let i = 1; i < open.length; i += 1) {
      if ((fScore.get(open[i]!) ?? Infinity) < (fScore.get(open[best]!) ?? Infinity)) best = i;
    }
    const currentKey = open.splice(best, 1)[0]!;
    if (currentKey === goalKey) return reconstruct(came, currentKey);
    closed.add(currentKey);
    const current = parseKey(currentKey);
    for (const dir of DIRS) {
      const next = { x: current.x + dir.x, y: current.y + dir.y };
      if (!isRoad(next.x, next.y)) continue;
      const nextKey = cellKey(next);
      if (closed.has(nextKey)) continue;
      if (blocked.has(nextKey) && nextKey !== goalKey) continue;
      const tentative = (gScore.get(currentKey) ?? Infinity) + 1;
      if (tentative >= (gScore.get(nextKey) ?? Infinity)) continue;
      came.set(nextKey, currentKey);
      gScore.set(nextKey, tentative);
      fScore.set(nextKey, tentative + heuristic(next, goal));
      if (!open.includes(nextKey)) open.push(nextKey);
    }
  }
  return null;
}

function heuristic(a: Cell, b: Cell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function parseKey(key: string): Cell {
  const [x, y] = key.split(",").map(Number);
  return { x: x ?? 0, y: y ?? 0 };
}

function reconstruct(came: Map<string, string>, goalKey: string): Cell[] {
  const out: Cell[] = [parseKey(goalKey)];
  let cursor = goalKey;
  while (came.has(cursor)) {
    cursor = came.get(cursor)!;
    out.push(parseKey(cursor));
  }
  out.pop();
  return out.reverse();
}

export type TownAgent = {
  id: string;
  character: string;
  home: Cell;
  /** 隊伍目前停在第幾步。 */
  leg: number;
  /** 正在走向的下一步；null 表示停著。 */
  toward: number | null;
  /** 0–1，走完一格。 */
  progress: number;
};

export function createTownAgents(
  ids: readonly { id: string; character: string }[],
  homes: readonly Cell[] = TOWN_HOMES,
): TownAgent[] {
  return ids.slice(0, homes.length).map((actor, index) => ({
    id: actor.id,
    character: actor.character,
    home: { x: homes[index]!.x, y: homes[index]!.y },
    leg: 0,
    toward: null,
    progress: 0,
  }));
}

export function agentOrigin(agent: TownAgent): { x: number; y: number } {
  const from = add(agent.home, PARADE_OFFSETS[agent.leg]!);
  if (agent.toward === null) return from;
  const to = add(agent.home, PARADE_OFFSETS[agent.toward]!);
  return {
    x: from.x + (to.x - from.x) * agent.progress,
    y: from.y + (to.y - from.y) * agent.progress,
  };
}

function footprintAt(agent: TownAgent, origin: Cell): Cell[] {
  return characterFootprint(agent.character).map((part) => ({
    x: origin.x + part.x,
    y: origin.y + part.y,
  }));
}

export function occupiedCells(agent: TownAgent): Cell[] {
  const bag = new Map<string, Cell>();
  const put = (origin: Cell) => {
    for (const cell of footprintAt(agent, origin)) bag.set(cellKey(cell), cell);
  };
  put(add(agent.home, PARADE_OFFSETS[agent.leg]!));
  if (agent.toward !== null && agent.progress > 0) {
    put(add(agent.home, PARADE_OFFSETS[agent.toward]!));
  }
  return [...bag.values()];
}

/**
 * 紅燈或有人預約不到下一格時，整隊停住，避免相對位置被拉開。
 * 一次最多走完一格，很大的 dt 也不會跳過預約。
 */
export function stepTown(
  agents: readonly TownAgent[],
  dt: number,
  opts: { reduced: boolean; allowMove: boolean },
): TownAgent[] {
  if (agents.length === 0) return [];
  if (opts.reduced) {
    return agents.map((agent) => ({ ...agent, toward: null, progress: 0 }));
  }
  if (dt <= 0) return agents.map((agent) => ({ ...agent }));

  let next = agents.map((agent) => ({ ...agent }));
  const moving = next.some((agent) => agent.toward !== null);
  if (!moving) {
    if (!opts.allowMove) return next;
    const planned = planParade(next);
    if (!planned) return next;
    next = next.map((agent, index) => ({
      ...agent,
      toward: planned[index]!,
      progress: 0,
    }));
  }

  const speed = 1.15;
  return next.map((agent) => {
    if (agent.toward === null) return agent;
    const progress = Math.min(1, agent.progress + speed * dt);
    if (progress < 1) return { ...agent, progress };
    return { ...agent, leg: agent.toward, toward: null, progress: 0 };
  });
}

function planParade(agents: readonly TownAgent[]): number[] | null {
  const held = new Map<string, string>();
  for (const agent of agents) {
    for (const cell of occupiedCells(agent)) held.set(cellKey(cell), agent.id);
  }
  const legs: number[] = [];
  for (const agent of agents) {
    const nextLeg = (agent.leg + 1) % PARADE_OFFSETS.length;
    const goal = add(agent.home, PARADE_OFFSETS[nextLeg]!);
    const start = add(agent.home, PARADE_OFFSETS[agent.leg]!);
    const blocked = new Set<string>();
    for (const [key, id] of held) {
      if (id !== agent.id) blocked.add(key);
    }
    for (const cell of footprintAt(agent, goal)) {
      if (!isRoad(cell.x, cell.y)) return null;
      const owner = held.get(cellKey(cell));
      if (owner && owner !== agent.id) return null;
    }
    const path = findPath(start, goal, blocked);
    if (!path || path.length !== 1 || !sameCell(path[0]!, goal)) return null;
    legs.push(nextLeg);
  }
  return legs;
}

export function hasOverlap(agents: readonly TownAgent[]): boolean {
  const seen = new Set<string>();
  for (const agent of agents) {
    for (const cell of occupiedCells(agent)) {
      const key = cellKey(cell);
      if (seen.has(key)) return true;
      seen.add(key);
    }
  }
  return false;
}

/** 多格建物拆開，每一格用自己的 gx+gy 排序。 */
export type DepthPiece = {
  id: string;
  propId: string;
  gx: number;
  gy: number;
  lx: number;
  ly: number;
  kind: "prop" | "car";
};

export function depthKey(gx: number, gy: number): number {
  return gx + gy;
}

export function splitFootprint(id: string, origin: Cell, w: number, h: number): DepthPiece[] {
  const pieces: DepthPiece[] = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      pieces.push({
        id: `${id}:${x}:${y}`,
        propId: id,
        gx: origin.x + x,
        gy: origin.y + y,
        lx: x,
        ly: y,
        kind: "prop",
      });
    }
  }
  return pieces;
}

export function sortByDepth(pieces: readonly DepthPiece[]): DepthPiece[] {
  return [...pieces].sort((a, b) => depthKey(a.gx, a.gy) - depthKey(b.gx, b.gy) || a.gx - b.gx);
}

export function piecesForFrame(agents: readonly TownAgent[]): DepthPiece[] {
  const props = TOWN_PROPS.flatMap((prop) => splitFootprint(prop.id, prop, prop.w, prop.h));
  const cars: DepthPiece[] = agents.map((agent) => {
    const origin = agentOrigin(agent);
    return {
      id: agent.id,
      propId: "",
      gx: origin.x,
      gy: origin.y,
      lx: 0,
      ly: 0,
      kind: "car",
    };
  });
  return sortByDepth([...props, ...cars]);
}

export type IsoLayout = { ox: number; oy: number; tw: number; th: number; zh: number };

type IsoBounds = { minDiff: number; maxDiff: number; minSum: number; maxSum: number };

function townIsoBounds(): IsoBounds {
  let minDiff = Infinity;
  let maxDiff = -Infinity;
  let minSum = Infinity;
  let maxSum = -Infinity;
  const cells = [...paradeCells(), ...propCells(), ...TOWN_PONDS];
  for (const cell of cells) {
    for (const corner of [
      { x: cell.x, y: cell.y },
      { x: cell.x + 1, y: cell.y },
      { x: cell.x + 1, y: cell.y + 1 },
      { x: cell.x, y: cell.y + 1 },
    ]) {
      const diff = corner.x - corner.y;
      const sum = corner.x + corner.y;
      minDiff = Math.min(minDiff, diff);
      maxDiff = Math.max(maxDiff, diff);
      minSum = Math.min(minSum, sum);
      maxSum = Math.max(maxSum, sum);
    }
  }
  return { minDiff, maxDiff, minSum, maxSum };
}

function propCells(): Cell[] {
  const cells: Cell[] = [];
  for (const prop of TOWN_PROPS) {
    for (let y = 0; y < prop.h; y += 1) {
      for (let x = 0; x < prop.w; x += 1) cells.push({ x: prop.x + x, y: prop.y + y });
    }
  }
  return cells;
}

export function isoLayout(view: { width: number; height: number }): IsoLayout {
  const box = townIsoBounds();
  const spanX = Math.max(1, box.maxDiff - box.minDiff);
  const spanY = Math.max(1, box.maxSum - box.minSum);
  const padX = 8;
  let padTop = 48;
  let padBottom = 18;
  let tw = 8;
  let th = 4;
  for (let pass = 0; pass < 6; pass += 1) {
    const twFromW = Math.max(1, (view.width - padX * 2) / spanX);
    const thFromH = Math.max(1, (view.height - padTop - padBottom) / spanY);
    th = Math.min(twFromW / 2, thFromH);
    tw = th * 2;
    padTop = Math.max(32, tw * 1.65);
    padBottom = Math.max(16, tw * 0.42);
  }
  const mapH = spanY * th;
  const spareY = Math.max(0, view.height - padTop - padBottom - mapH);
  return {
    tw,
    th,
    zh: tw * Z_PER_TW,
    ox: (view.width - spanX * tw) / 2 - box.minDiff * tw,
    oy: padTop + spareY / 2 - box.minSum * th,
  };
}

export function projectIso(
  gx: number,
  gy: number,
  z: number,
  layout: IsoLayout,
): { x: number; y: number } {
  return {
    x: layout.ox + (gx - gy) * layout.tw,
    y: layout.oy + (gx + gy) * layout.th - z * layout.zh,
  };
}

/** 彈跳。減少動態時是 0。各台相位錯開，不會同一下一起跳。 */
export function bounceHeight(age: number, index: number, reduced: boolean, moving: boolean): number {
  if (reduced) return 0;
  const speed = moving ? 8.4 : 3.2;
  const amp = moving ? 0.08 : 0.05;
  return Math.abs(Math.sin(age * speed + index * 0.9)) * amp;
}

/** 眨眼。減少動態或剛開始時眼睛張開。 */
export function eyesClosed(age: number, index: number, reduced: boolean): boolean {
  if (reduced || age <= 0) return false;
  const cycle = 3.6;
  const t = (((age + index * 0.41) % cycle) + cycle) % cycle;
  return t > cycle - 0.16;
}

export function actorButtonPoint(
  agent: TownAgent,
  index: number,
  layout: IsoLayout,
  age: number,
  reduced: boolean,
): { x: number; y: number } {
  const origin = agentOrigin(agent);
  const z = BUTTON_LIFT + bounceHeight(age, index, reduced, agent.toward !== null);
  return projectIso(origin.x + 0.5, origin.y + 0.5, z, layout);
}

export function edgeGap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): number {
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  const gapX = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
  const gapY = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);
  if (overlapX > 0 && overlapY > 0) return -Math.min(overlapX, overlapY);
  if (overlapX > 0) return gapY;
  if (overlapY > 0) return gapX;
  return Math.hypot(Math.max(gapX, 0), Math.max(gapY, 0));
}

/** 畫面上相鄰按鈕的最小邊緣間距。沒有車時回傳無限大。 */
export function actorHitGap(
  agents: readonly TownAgent[],
  view: { width: number; height: number },
  age = 0,
  reduced = false,
): number {
  if (agents.length < 2) return Infinity;
  const layout = isoLayout(view);
  const rects = agents.map((agent, index) => {
    const point = actorButtonPoint(agent, index, layout, age, reduced);
    return { x: point.x - HIT_SIZE / 2, y: point.y - HIT_SIZE / 2, w: HIT_SIZE, h: HIT_SIZE };
  });
  let min = Infinity;
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      min = Math.min(min, edgeGap(rects[i]!, rects[j]!));
    }
  }
  return min;
}
