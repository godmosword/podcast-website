import type { BoardActionId, BoardCharacterId } from "@/lib/episode-board-types";

/** 按鈕直徑 48 加上相鄰 8。車身若畫得更大，間隔再跟著加。 */
export const MIN_ACTOR_SCREEN_GAP = 56;

/** 跟畫面縮放同一套，讓碰撞間隔蓋得住車身，而不只是圓心。 */
export function spriteScale(view: BoardView): number {
  const basis = Math.min(view.width, view.height);
  return Math.max(2.8, Math.min(4.8, basis / 128));
}

export function minActorScreenGap(view: BoardView): number {
  return Math.max(MIN_ACTOR_SCREEN_GAP, spriteScale(view) * 22 + 8);
}

/** 畫布裝置像素比上限。再高只是多畫像素，手機不划算。 */
export const MAX_CANVAS_DPR = 2;

const SPAN_X = 92;
const SPAN_Y = 150;
const ORIGIN_V = 0.1;
const ACTOR_RADIUS = 4.8;
const SUBSTEP = 1 / 30;

export type BoardView = {
  width: number;
  height: number;
};

export type TownPropKind = "cottage" | "tree" | "pond" | "light" | "candy";

export type TownProp = {
  id: string;
  kind: TownPropKind;
  x: number;
  y: number;
  r: number;
};

export type Waypoint = {
  x: number;
  y: number;
  gate?: boolean;
};

export const TOWN_PROPS: readonly TownProp[] = [
  { id: "cottage", kind: "cottage", x: 30, y: 26, r: 6.2 },
  { id: "tree-east", kind: "tree", x: 60, y: 22, r: 4.2 },
  { id: "tree-west", kind: "tree", x: 18, y: 30, r: 4.2 },
  { id: "pond", kind: "pond", x: 62, y: 28, r: 6.4 },
  { id: "light", kind: "light", x: 48, y: 40, r: 2.6 },
  { id: "candy", kind: "candy", x: 36, y: 10, r: 2.8 },
];

const LIGHT_PROP = TOWN_PROPS.find((prop) => prop.kind === "light")!;

type Slot = {
  path: readonly Waypoint[];
};

/** 路線刻意分開。紅綠燈那條有 gate，會變成機器人的紅車也走這條。 */
const SLOTS: readonly Slot[] = [
  {
    path: [
      { x: 48, y: 14 },
      { x: 58, y: 16 },
      { x: 54, y: 22 },
      { x: 42, y: 16 },
    ],
  },
  {
    path: [
      { x: 28, y: 34 },
      { x: 54, y: 48, gate: true },
      { x: 58, y: 34 },
      { x: 40, y: 36 },
      { x: 32, y: 40 },
    ],
  },
  {
    path: [
      { x: 24, y: 50 },
      { x: 36, y: 54 },
      { x: 28, y: 60 },
      { x: 20, y: 54 },
    ],
  },
  {
    path: [
      { x: 40, y: 56 },
      { x: 52, y: 58 },
      { x: 46, y: 64 },
      { x: 36, y: 60 },
    ],
  },
];

const SLOT_PREFERENCE: Partial<Record<BoardActionId, number>> = {
  "brush-teeth": 0,
  sweep: 0,
  "wait-light": 1,
  "transform-robot": 1,
  drive: 1,
  "paint-self": 2,
  dig: 3,
  idle: 2,
};

const SPEED: Record<BoardActionId, number> = {
  idle: 0,
  drive: 6,
  "brush-teeth": 3.2,
  "wait-light": 6,
  "paint-self": 4.2,
  "transform-robot": 5,
  dig: 2.4,
  sweep: 3.6,
};

export type LightPhase = "stop" | "count" | "go";

export type BoardPose = {
  bob: number;
  robot: number;
  brush: number;
  /** 0、1、2 是借來的顏色，3 是自己原來的顏色。 */
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

export type BoardSimState = {
  age: number;
  actors: SimActor[];
};

export type BoardSpawn = {
  id: string;
  character: BoardCharacterId;
  action: BoardActionId;
};

export function projectNorm(x: number, y: number): { u: number; v: number } {
  return {
    u: 0.5 + (x - y) / SPAN_X,
    v: ORIGIN_V + (x + y) / SPAN_Y,
  };
}

export function screenPoint(
  x: number,
  y: number,
  view: BoardView,
): { x: number; y: number } {
  const norm = projectNorm(x, y);
  return { x: norm.u * view.width, y: norm.v * view.height };
}

/** 等角深度：x + y 越大越靠近鏡頭，要後畫。 */
export function depthKey(x: number, y: number, bias = 0): number {
  return x + y + bias;
}

export type DrawEntity = {
  id: string;
  kind: "prop" | "actor";
  x: number;
  y: number;
  depth: number;
  prop?: TownProp;
  actor?: SimActor;
};

export function sortDrawOrder(state: BoardSimState): DrawEntity[] {
  const props: DrawEntity[] = TOWN_PROPS.map((prop) => ({
    id: prop.id,
    kind: "prop",
    x: prop.x,
    y: prop.y,
    depth: depthKey(prop.x, prop.y),
    prop,
  }));
  const actors: DrawEntity[] = state.actors.map((actor) => ({
    id: actor.id,
    kind: "actor",
    x: actor.x,
    y: actor.y,
    depth: depthKey(actor.x, actor.y, 0.35),
    actor,
  }));
  return [...props, ...actors].sort((a, b) => a.depth - b.depth);
}

export function lightPhase(age: number): LightPhase {
  const t = ((age % 3.6) + 3.6) % 3.6;
  if (t < 1.4) return "stop";
  if (t < 2.2) return "count";
  return "go";
}

export function poseFor(
  action: BoardActionId,
  age: number,
  waiting: boolean,
): BoardPose {
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
  return {
    bob,
    robot,
    brush: ((age % 1.1) + 1.1) % 1.1 / 1.1,
    paint: action === "paint-self" ? paint : 3,
    dig: ((age % 1.6) + 1.6) % 1.6 / 1.6,
    sweep: ((age % 0.8) + 0.8) % 0.8 / 0.8,
    waiting,
  };
}

export function canvasPixelSize(
  cssWidth: number,
  cssHeight: number,
  dpr: number,
): { ratio: number; width: number; height: number } {
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

/**
 * 用 rAF 的 timestamp 算這格要前進多少秒。
 * 暫停時把 last 更新成現在，恢復後才不會一次跳很遠。
 * 單格最多 50ms，避免切回分頁的第一格穿模。
 */
export function deltaSeconds(
  now: number,
  last: number | null,
  paused: boolean,
): { dt: number; last: number } {
  if (last === null || paused || !Number.isFinite(now)) {
    return { dt: 0, last: Number.isFinite(now) ? now : 0 };
  }
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  return { dt, last: now };
}

export function createBoardSim(spawns: readonly BoardSpawn[]): BoardSimState {
  const used = new Set<number>();
  const actors: SimActor[] = spawns.map((spawn) => {
    const preferred = SLOT_PREFERENCE[spawn.action] ?? 0;
    let slot = preferred;
    if (used.has(slot)) {
      slot = SLOTS.findIndex((_, index) => !used.has(index));
      if (slot < 0) slot = 0;
    }
    used.add(slot);
    const path = SLOTS[slot]?.path ?? SLOTS[0]!.path;
    const gateIndex = path.findIndex((point) => point.gate);
    const startIndex =
      spawn.action === "wait-light" && gateIndex >= 0 ? gateIndex : 0;
    const start = path[startIndex] ?? path[0]!;
    return {
      id: spawn.id,
      character: spawn.character,
      action: spawn.action,
      x: start.x,
      y: start.y,
      r: ACTOR_RADIUS,
      path,
      pathIndex: startIndex,
      age: spawn.action === "paint-self" ? 3.6 : 0,
      stuck: 0,
      waiting: spawn.action === "wait-light" && gateIndex >= 0,
    };
  });
  return { age: 0, actors };
}

export function stepBoard(
  state: BoardSimState,
  dt: number,
  view: BoardView,
): BoardSimState {
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

export function actorScreenGap(
  state: BoardSimState,
  view: BoardView,
): number {
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
    for (const prop of TOWN_PROPS) {
      const dist = Math.hypot(actor.x - prop.x, actor.y - prop.y);
      min = Math.min(min, dist - actor.r - prop.r);
    }
  }
  return min;
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
    for (const prop of TOWN_PROPS) {
      pushApart(actor, prop.x, prop.y, actor.r + prop.r, 1);
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
  for (let i = 0; i < actors.length; i += 1) {
    for (let j = i + 1; j < actors.length; j += 1) {
      const a = actors[i]!;
      const b = actors[j]!;
      const as = screenPoint(a.x, a.y, view);
      const bs = screenPoint(b.x, b.y, view);
      let dx = bs.x - as.x;
      let dy = bs.y - as.y;
      let dist = Math.hypot(dx, dy);
      const minGap = minActorScreenGap(view);
      if (dist >= minGap) continue;
      if (dist < 0.5) {
        dx = 1;
        dy = 0;
        dist = 1;
      }
      const need = Math.min(24, (minGap - dist) / 2);
      nudgeByScreen(a, (-dx / dist) * need, (-dy / dist) * need, view);
      nudgeByScreen(b, (dx / dist) * need, (dy / dist) * need, view);
    }
  }
}

function pushApart(
  actor: SimActor,
  x: number,
  y: number,
  min: number,
  share: number,
) {
  let dx = actor.x - x;
  let dy = actor.y - y;
  let dist = Math.hypot(dx, dy);
  if (dist >= min) return;
  if (dist < 0.001) {
    dx = 1;
    dy = 0;
    dist = 1;
  }
  const push = ((min - dist) / dist) * share;
  actor.x += dx * push;
  actor.y += dy * push;
}

function nudgeByScreen(
  actor: SimActor,
  dpx: number,
  dpy: number,
  view: BoardView,
) {
  const du = dpx / view.width;
  const dv = dpy / view.height;
  actor.x += (du * SPAN_X + dv * SPAN_Y) / 2;
  actor.y += (dv * SPAN_Y - du * SPAN_X) / 2;
}

function clampActor(actor: SimActor) {
  actor.x = Math.min(74, Math.max(12, actor.x));
  actor.y = Math.min(66, Math.max(8, actor.y));
}

export function nearestLightDistance(actor: SimActor): number {
  return Math.hypot(actor.x - LIGHT_PROP.x, actor.y - LIGHT_PROP.y);
}
