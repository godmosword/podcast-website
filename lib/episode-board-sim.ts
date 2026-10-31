import type { BoardActionId, BoardCharacterId } from "@/lib/episode-board-types";

/** 按鈕直徑 48 加上相鄰 8。 */
export const MIN_ACTOR_SCREEN_GAP = 56;

/** 畫布裝置像素比上限。地圖改走宇宙地圖的圖片層之後，這仍給需要畫布的測試用。 */
export const MAX_CANVAS_DPR = 2;

const ACTOR_RADIUS = 4.2;
const SUBSTEP = 1 / 30;

export type BoardView = { width: number; height: number };

/** 跟宇宙地圖同一組島：車車樂園在中間，其餘四島分開。 */
export type BoardIslandId = "forest" | "dino" | "rescue" | "car-park" | "ocean";

export type BoardIsland = {
  id: BoardIslandId;
  /** 舞台百分比，沙岸底中心（對齊島圖 anchor）。 */
  x: number;
  y: number;
  /** 碰撞圓半徑（舞台百分比）。 */
  r: number;
  /** 島圖寬度占舞台寬的百分比。 */
  width: number;
};

export const BOARD_ISLANDS: readonly BoardIsland[] = [
  { id: "forest", x: 50, y: 20, r: 8, width: 30 },
  { id: "dino", x: 16, y: 34, r: 7.5, width: 26 },
  { id: "rescue", x: 84, y: 34, r: 7.5, width: 26 },
  { id: "car-park", x: 50, y: 50, r: 10, width: 36 },
  { id: "ocean", x: 28, y: 74, r: 7.5, width: 26 },
];

/** 紅綠燈是海上的小建物，車不能穿過去。 */
export const BOARD_LIGHT = { id: "light", x: 70, y: 62, r: 3 } as const;

type Obstacle = { id: string; x: number; y: number; r: number };

const OBSTACLES: readonly Obstacle[] = [
  ...BOARD_ISLANDS.map((island) => ({ id: island.id, x: island.x, y: island.y, r: island.r })),
  BOARD_LIGHT,
];

export type Waypoint = { x: number; y: number; gate?: boolean };

type Home = { x: number; y: number; gate?: boolean };

/** 起點都在島與島之間的海面上，彼此在 320px 寬時仍隔得開。 */
const HOMES: readonly Home[] = [
  { x: 8, y: 22 },
  { x: 58, y: 64, gate: true },
  { x: 78, y: 18 },
  { x: 8, y: 48 },
  { x: 88, y: 48 },
  { x: 70, y: 82 },
  { x: 88, y: 78 },
  { x: 8, y: 88 },
  { x: 62, y: 28 },
  { x: 48, y: 90 },
  { x: 92, y: 8 },
  { x: 22, y: 60 },
];

const SPEED: Record<BoardActionId, number> = {
  idle: 0,
  drive: 5,
  "brush-teeth": 3,
  "wait-light": 5,
  "paint-self": 3.6,
  "transform-robot": 4.4,
  dig: 2.2,
  lift: 2.2,
  sweep: 3.2,
};

export type LightPhase = "stop" | "count" | "go";

export type BoardPose = {
  bob: number;
  robot: number;
  brush: number;
  paint: 0 | 1 | 2 | 3;
  dig: number;
  sweep: number;
  waiting: boolean;
};

export type SimActor = {
  id: string;
  character: BoardCharacterId;
  action: BoardActionId;
  x: number;
  y: number;
  r: number;
  path: readonly Waypoint[];
  pathIndex: number;
  age: number;
  stuck: number;
  waiting: boolean;
};

export type BoardSimState = { age: number; actors: SimActor[] };

export type BoardSpawn = {
  id: string;
  character: BoardCharacterId;
  action: BoardActionId;
};

export function minActorScreenGap(view?: BoardView): number {
  void view;
  return MIN_ACTOR_SCREEN_GAP;
}

/** 舞台百分比 → 0–1，給按鈕的 translate 用。y 越大越靠近鏡頭。 */
export function projectNorm(x: number, y: number): { u: number; v: number } {
  return { u: x / 100, v: y / 100 };
}

export function screenPoint(x: number, y: number, view: BoardView): { x: number; y: number } {
  return { x: (x / 100) * view.width, y: (y / 100) * view.height };
}

/** 與宇宙地圖相同：y 越大越靠近鏡頭，要後畫。 */
export function depthKey(x: number, y: number, bias = 0): number {
  return y + bias + x * 0.0001;
}

export type DrawEntity = {
  id: string;
  kind: "prop" | "actor";
  x: number;
  y: number;
  depth: number;
};

export function sortDrawOrder(state: BoardSimState): DrawEntity[] {
  const props: DrawEntity[] = OBSTACLES.map((prop) => ({
    id: prop.id,
    kind: "prop" as const,
    x: prop.x,
    y: prop.y,
    depth: depthKey(prop.x, prop.y),
  }));
  const actors: DrawEntity[] = state.actors.map((actor) => ({
    id: actor.id,
    kind: "actor" as const,
    x: actor.x,
    y: actor.y,
    depth: depthKey(actor.x, actor.y, 0.35),
  }));
  return [...props, ...actors].sort((a, b) => a.depth - b.depth);
}

export function lightPhase(age: number): LightPhase {
  const t = ((age % 3.6) + 3.6) % 3.6;
  if (t < 1.4) return "stop";
  if (t < 2.2) return "count";
  return "go";
}

export function poseFor(action: BoardActionId, age: number, waiting: boolean): BoardPose {
  const bob = action === "idle" || waiting ? 0 : Math.sin(age * 3.2);
  const cycle = ((age % 4) + 4) % 4;
  let robot = 0;
  if (action === "transform-robot") {
    if (cycle >= 1.2 && cycle < 1.8) robot = (cycle - 1.2) / 0.6;
    else if (cycle >= 1.8 && cycle < 3) robot = 1;
    else if (cycle >= 3 && cycle < 3.6) robot = 1 - (cycle - 3) / 0.6;
  }
  const paintSlot = Math.floor((((age % 4.8) + 4.8) % 4.8) / 1.2);
  const paint = (paintSlot > 3 ? 3 : paintSlot) as 0 | 1 | 2 | 3;
  const swing = (((age % 1.6) + 1.6) % 1.6) / 1.6;
  return {
    bob,
    robot,
    brush: (((age % 1.1) + 1.1) % 1.1) / 1.1,
    paint: action === "paint-self" ? paint : 3,
    dig: action === "dig" || action === "lift" ? swing : 0,
    sweep: (((age % 0.8) + 0.8) % 0.8) / 0.8,
    waiting,
  };
}

export function canvasPixelSize(cssWidth: number, cssHeight: number, dpr: number) {
  const ratio = Math.min(MAX_CANVAS_DPR, Math.max(1, Number.isFinite(dpr) ? dpr : 1));
  return {
    ratio,
    width: Math.max(1, Math.round(Math.max(0, cssWidth) * ratio)),
    height: Math.max(1, Math.round(Math.max(0, cssHeight) * ratio)),
  };
}

export function boardClockPaused(input: {
  reduced: boolean;
  visible: boolean;
  pageVisible: boolean;
}): boolean {
  return input.reduced || !input.visible || !input.pageVisible;
}

export function deltaSeconds(now: number, last: number | null, paused: boolean) {
  if (last === null || paused || !Number.isFinite(now)) {
    return { dt: 0, last: Number.isFinite(now) ? now : 0 };
  }
  return { dt: Math.min(0.05, Math.max(0, (now - last) / 1000)), last: now };
}

export function createBoardSim(spawns: readonly BoardSpawn[]): BoardSimState {
  const used = new Set<number>();
  const actors = spawns.map((spawn) => {
    const home = takeHome(spawn.action === "wait-light", used);
    const path = loopAround(home.x, home.y, Boolean(home.gate));
    const start = path[0]!;
    return {
      id: spawn.id,
      character: spawn.character,
      action: spawn.action,
      x: start.x,
      y: start.y,
      r: ACTOR_RADIUS,
      path,
      pathIndex: 0,
      age: spawn.action === "paint-self" ? 3.6 : 0,
      stuck: 0,
      waiting: Boolean(home.gate && spawn.action === "wait-light"),
    };
  });
  return { age: 0, actors };
}

function takeHome(preferGate: boolean, used: Set<number>): Home {
  if (preferGate) {
    const gate = HOMES.findIndex((home, index) => home.gate && !used.has(index));
    if (gate >= 0) {
      used.add(gate);
      return HOMES[gate]!;
    }
  }
  const free = HOMES.findIndex((_, index) => !used.has(index));
  const index = free >= 0 ? free : used.size % HOMES.length;
  used.add(index);
  return HOMES[index]!;
}

export function stepBoard(state: BoardSimState, dt: number, view: BoardView): BoardSimState {
  const safeDt = Math.min(0.05, Math.max(0, dt));
  if (safeDt === 0 || state.actors.length === 0) return state;
  const actors = state.actors.map((actor) => ({ ...actor }));
  let age = state.age;
  let left = safeDt;
  while (left > 1e-6) {
    const h = Math.min(SUBSTEP, left);
    age += h;
    for (const actor of actors) advanceActor(actor, h, age);
    for (let pass = 0; pass < 3; pass += 1) {
      separateFromProps(actors);
      separateActors(actors);
      separateOnScreen(actors, view);
    }
    separateFromProps(actors);
    for (const actor of actors) clampActor(actor);
    left -= h;
  }
  return { age, actors };
}

export function actorScreenGap(state: BoardSimState, view: BoardView): number {
  let min = Infinity;
  for (let i = 0; i < state.actors.length; i += 1) {
    for (let j = i + 1; j < state.actors.length; j += 1) {
      const a = screenPoint(state.actors[i]!.x, state.actors[i]!.y, view);
      const b = screenPoint(state.actors[j]!.x, state.actors[j]!.y, view);
      min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y));
    }
  }
  return min;
}

export function actorPropClearance(state: BoardSimState): number {
  let min = Infinity;
  for (const actor of state.actors) {
    for (const prop of OBSTACLES) {
      min = Math.min(min, Math.hypot(actor.x - prop.x, actor.y - prop.y) - actor.r - prop.r);
    }
  }
  return min;
}

function loopAround(x: number, y: number, gate: boolean): Waypoint[] {
  return [
    { x, y, gate },
    { x: clampNum(x + 3), y: clampNum(y + 1.2) },
    { x: clampNum(x + 0.4), y: clampNum(y + 3.2) },
    { x: clampNum(x - 2.4), y: clampNum(y + 1) },
  ];
}

function advanceActor(actor: SimActor, h: number, age: number) {
  actor.age += h;
  const speed = SPEED[actor.action];
  if (speed <= 0 || actor.path.length === 0) {
    actor.waiting = false;
    return;
  }
  const target = actor.path[actor.pathIndex % actor.path.length]!;
  const dx = target.x - actor.x;
  const dy = target.y - actor.y;
  const dist = Math.hypot(dx, dy);
  const hold =
    actor.action === "wait-light" &&
    Boolean(target.gate) &&
    dist < 4.5 &&
    lightPhase(age) !== "go";
  actor.waiting = hold;
  if (hold) return;
  if (dist < 1.15) {
    actor.pathIndex = (actor.pathIndex + 1) % actor.path.length;
    actor.stuck = 0;
    return;
  }
  const step = Math.min(dist, speed * h);
  actor.x += (dx / dist) * step;
  actor.y += (dy / dist) * step;
  if (step < speed * h * 0.35) actor.stuck += h;
  else actor.stuck = 0;
  if (actor.stuck > 1.5) {
    actor.pathIndex = (actor.pathIndex + 1) % actor.path.length;
    actor.stuck = 0;
  }
}

function separateFromProps(actors: SimActor[]) {
  for (const actor of actors) {
    for (const prop of OBSTACLES) {
      let dx = actor.x - prop.x;
      let dy = actor.y - prop.y;
      let dist = Math.hypot(dx, dy);
      const min = actor.r + prop.r;
      if (dist >= min) continue;
      if (dist < 0.001) {
        dx = 1;
        dy = 0;
        dist = 1;
      }
      const push = (min - dist) / dist;
      actor.x += dx * push;
      actor.y += dy * push;
    }
  }
}

function separateActors(actors: SimActor[]) {
  for (let i = 0; i < actors.length; i += 1) {
    for (let j = i + 1; j < actors.length; j += 1) {
      const a = actors[i]!;
      const b = actors[j]!;
      const min = a.r + b.r;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      if (dist >= min) continue;
      const push = (min - dist) / dist / 2;
      a.x -= dx * push;
      a.y -= dy * push;
      b.x += dx * push;
      b.y += dy * push;
    }
  }
}

function separateOnScreen(actors: SimActor[], view: BoardView) {
  if (view.width < 8 || view.height < 8) return;
  const minGap = MIN_ACTOR_SCREEN_GAP;
  for (let i = 0; i < actors.length; i += 1) {
    for (let j = i + 1; j < actors.length; j += 1) {
      const a = actors[i]!;
      const b = actors[j]!;
      const as = screenPoint(a.x, a.y, view);
      const bs = screenPoint(b.x, b.y, view);
      let dx = bs.x - as.x;
      let dy = bs.y - as.y;
      let dist = Math.hypot(dx, dy);
      if (dist >= minGap) continue;
      if (dist < 0.5) {
        dx = 1;
        dy = 0;
        dist = 1;
      }
      const need = Math.min(18, (minGap - dist) / 2);
      nudge(a, (-dx / dist) * need, (-dy / dist) * need, view);
      nudge(b, (dx / dist) * need, (dy / dist) * need, view);
    }
  }
}

function nudge(actor: SimActor, dpx: number, dpy: number, view: BoardView) {
  actor.x += (dpx / view.width) * 100;
  actor.y += (dpy / view.height) * 100;
}

function clampActor(actor: SimActor) {
  actor.x = clampNum(actor.x);
  actor.y = clampNum(actor.y);
}

function clampNum(value: number): number {
  return Math.min(94, Math.max(6, value));
}
