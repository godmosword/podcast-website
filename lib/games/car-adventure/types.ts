import {
  levelFromJson,
  type AdventureLevel,
} from "@/lib/gamekit/games/adventure-level";
import { CAR_ADVENTURE_LEVELS } from "@/lib/games/car-adventure/levels";

export const TILE = 36;
export const VW = 720;
export const VH = 432;
const KIT_W = 320;
const KIT_H = 180;
export const RENDER_SX = KIT_W / VW;
export const RENDER_SY = KIT_H / VH;
export const ROWS = 12;
export const GRAV = 2000;
export const MOVE = 1700;
export const MAXVX = 235;
export const FRICTION = 1600;
export const JUMP = 720;
export const MAXFALL = 920;
export const COYOTE = 0.09;
export const BUFFER = 0.12;
export const BOUNCE = 440;
export const INVULN = 1.4;

export type Status = "ready" | "playing" | "paused" | "won" | "over";

export interface Input {
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
}

interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: number;
  coyote: number;
  jumpBuf: number;
  jumpHeld: boolean;
  jumpCut: boolean;
  invuln: number;
  dashTime: number;
  dashCooldown: number;
  dashHeld: boolean;
}

export interface GameState {
  lv: AdventureLevel;
  levelIndex: number;
  /** 兒童模式：加寬跳躍容錯，讓第一次玩也能掌握節奏。 */
  assist: boolean;
  player: Player;
  cam: number;
  score: number;
  lives: number;
  taken: number;
  input: Input;
  last: number | null;
  finishCleared: boolean;
  /** 本關經過秒數；只在 playing 的 fixed update 累加。 */
  elapsed: number;
  /** 本次完成計算出的 0–3 顆車車大冒險顯示星。 */
  earnedStars: number;
  prevPlayer: { x: number; y: number };
  renderAlpha: number;
  /** 本關已撞碎的可破壞磚 tile key（每關 reset 清空；不改 lv 資料）。 */
  broken: Set<string>;
  /** 本關已觸發的秘密格與揭示進度（每關 reset 清空）。 */
  revealedSecrets: Set<string>;
  secretRevealProgress: Map<string, number>;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const approach = (v: number, target: number, amt: number) =>
  v > target ? Math.max(target, v - amt) : Math.min(target, v + amt);

function loadAdventureLevel(index: number): AdventureLevel {
  const json =
    CAR_ADVENTURE_LEVELS[
      Math.max(0, Math.min(index, CAR_ADVENTURE_LEVELS.length - 1))
    ];
  return levelFromJson(json);
}

/** 建立一局初始狀態（含兒童模式生命數）。 */
export function createGameState(
  idx: number,
  startLives: number,
  assist = false,
): GameState {
  const lv = loadAdventureLevel(idx);
  return {
    lv,
    levelIndex: idx,
    assist,
    player: {
      x: lv.start.x,
      y: lv.start.y,
      w: 30,
      h: 26,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      coyote: 0,
      jumpBuf: 0,
      jumpHeld: false,
      jumpCut: false,
      invuln: 0,
      dashTime: 0,
      dashCooldown: 0,
      dashHeld: false,
    },
    cam: 0,
    score: 0,
    lives: startLives,
    taken: 0,
    input: { left: false, right: false, jump: false, dash: false },
    last: null,
    finishCleared: false,
    elapsed: 0,
    earnedStars: 0,
    prevPlayer: { x: lv.start.x, y: lv.start.y },
    renderAlpha: 1,
    broken: new Set(),
    revealedSecrets: new Set(),
    secretRevealProgress: new Map(),
  };
}

/** 推進到下一關時重置玩家位置（保留分數與生命）。 */
export function applyAdvanceLevel(g: GameState, next: number): void {
  const lv = loadAdventureLevel(next);
  g.lv = lv;
  g.levelIndex = next;
  g.player = {
    x: lv.start.x,
    y: lv.start.y,
    w: 30,
    h: 26,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    coyote: 0,
    jumpBuf: 0,
    jumpHeld: false,
    jumpCut: false,
    invuln: INVULN,
    dashTime: 0,
    dashCooldown: 0,
    dashHeld: false,
  };
  g.cam = 0;
  g.taken = 0;
  g.last = null;
  g.finishCleared = false;
  g.elapsed = 0;
  g.earnedStars = 0;
  g.prevPlayer = { x: lv.start.x, y: lv.start.y };
  g.renderAlpha = 1;
  g.broken = new Set();
  g.revealedSecrets = new Set();
  g.secretRevealProgress = new Map();
}
