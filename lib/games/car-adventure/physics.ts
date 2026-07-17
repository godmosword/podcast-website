import { reportGameSession } from "@/lib/gamekit/progress/session";
import type { JuiceController } from "@/lib/gamekit/runtime/juice";
import { CAR_ADVENTURE_LEVELS } from "@/lib/games/car-adventure/levels";
import {
  approach,
  applyAdvanceLevel,
  BOUNCE,
  BUFFER,
  COYOTE,
  FRICTION,
  GRAV,
  INVULN,
  JUMP,
  MAXFALL,
  MAXVX,
  MOVE,
  TILE,
  VW,
  type GameState,
  type Status,
} from "@/lib/games/car-adventure/types";

export type PhysicsCallbacks = {
  reduced: boolean;
  juice: JuiceController;
  levelStartLives: number;
  onJump: () => void;
  onCoin: () => void;
  onStomp: () => void;
  onHurt: () => void;
  onWin: () => void;
  setStatus: (s: Status) => void;
  onAdvanceLevel: (next: number) => void;
};

function solidAt(g: GameState, tx: number, ty: number): boolean {
  return g.lv.solid.has(`${tx},${ty}`);
}

function collide(g: GameState, axis: "x" | "y"): void {
  const p = g.player;
  const x0 = Math.floor(p.x / TILE);
  const x1 = Math.floor((p.x + p.w - 0.01) / TILE);
  const y0 = Math.floor(p.y / TILE);
  const y1 = Math.floor((p.y + p.h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!solidAt(g, tx, ty)) continue;
      if (axis === "x") {
        if (p.vx > 0) p.x = tx * TILE - p.w;
        else if (p.vx < 0) p.x = (tx + 1) * TILE;
        p.vx = 0;
        return;
      }
      if (p.vy > 0) {
        p.y = ty * TILE - p.h;
        p.onGround = true;
      } else if (p.vy < 0) p.y = (ty + 1) * TILE;
      p.vy = 0;
      return;
    }
  }
}

function overlapsTileSet(
  set: Set<string>,
  box: { l: number; r: number; t: number; b: number },
): boolean {
  const x0 = Math.floor(box.l / TILE);
  const x1 = Math.floor((box.r - 0.01) / TILE);
  const y0 = Math.floor(box.t / TILE);
  const y1 = Math.floor((box.b - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++)
      if (set.has(`${tx},${ty}`)) return true;
  return false;
}

function die(g: GameState, fx: PhysicsCallbacks): void {
  fx.onHurt();
  if (!fx.reduced) fx.juice.shake.trigger(0.22, 6);
  g.lives--;
  if (g.lives <= 0) {
    reportGameSession({
      gameId: "car-adventure",
      score: g.score,
    });
    fx.setStatus("over");
    return;
  }
  const p = g.player;
  p.x = g.lv.start.x;
  p.y = g.lv.start.y;
  p.vx = 0;
  p.vy = 0;
  p.invuln = INVULN + (g.assist ? 0.8 : 0);
  g.cam = 0;
}

/** 固定步進物理更新（僅在 playing 時呼叫）。 */
export function updateAdventure(
  g: GameState,
  dt: number,
  fx: PhysicsCallbacks,
): void {
  const p = g.player;
  const inp = g.input;
  const coyoteWindow = g.assist ? 0.15 : COYOTE;
  const jumpBuffer = g.assist ? 0.18 : BUFFER;
  if (inp.left && !inp.right) {
    p.vx = Math.max(-MAXVX, p.vx - MOVE * dt);
    p.facing = -1;
  } else if (inp.right && !inp.left) {
    p.vx = Math.min(MAXVX, p.vx + MOVE * dt);
    p.facing = 1;
  } else p.vx = approach(p.vx, 0, FRICTION * dt);

  p.jumpBuf -= dt;
  p.coyote -= dt;
  if (inp.jump && !p.jumpHeld) {
    p.jumpBuf = jumpBuffer;
    p.jumpHeld = true;
  }
  if (!inp.jump) {
    if (p.jumpHeld && p.vy < 0 && !p.jumpCut) {
      p.vy *= 0.45;
      p.jumpCut = true;
    }
    p.jumpHeld = false;
  }
  if (p.jumpBuf > 0 && (p.onGround || p.coyote > 0)) {
    p.vy = -(g.assist ? JUMP * 1.08 : JUMP);
    p.onGround = false;
    p.coyote = 0;
    p.jumpBuf = 0;
    p.jumpCut = false;
    fx.onJump();
  }
  p.vy = Math.min(MAXFALL, p.vy + GRAV * dt);

  p.x += p.vx * dt;
  collide(g, "x");
  p.y += p.vy * dt;
  p.onGround = false;
  collide(g, "y");
  if (p.onGround) p.coyote = coyoteWindow;
  if (p.invuln > 0) p.invuln -= dt;

  const box = { l: p.x, r: p.x + p.w, t: p.y, b: p.y + p.h };
  if (overlapsTileSet(g.lv.spikes, box)) return die(g, fx);
  if (p.y > g.lv.worldH + 80) return die(g, fx);

  for (const c of g.lv.coins) {
    if (c.taken) continue;
    if (
      Math.abs(c.x - (p.x + p.w / 2)) < 20 &&
      Math.abs(c.y - (p.y + p.h / 2)) < 22
    ) {
      c.taken = true;
      g.taken++;
      g.score += 100;
      fx.onCoin();
      if (!fx.reduced) {
        fx.juice.burst(c.x - g.cam, c.y, 8, "#ffc107", 2);
      }
    }
  }

  for (const e of g.lv.enemies) {
    if (!e.alive) continue;
    e.x += e.vx * e.dir * dt;
    const footTx = Math.floor((e.x + (e.dir > 0 ? e.w + 2 : -2)) / TILE);
    const footTy = Math.floor((e.y + e.h + 2) / TILE);
    const wallTy = Math.floor((e.y + e.h / 2) / TILE);
    const wallTx = Math.floor((e.x + (e.dir > 0 ? e.w + 1 : -1)) / TILE);
    if (!solidAt(g, footTx, footTy) || solidAt(g, wallTx, wallTy)) {
      e.dir *= -1;
      e.x += e.vx * e.dir * dt;
    }
    if (
      box.r > e.x &&
      box.l < e.x + e.w &&
      box.b > e.y &&
      box.t < e.y + e.h
    ) {
      if (p.vy > 0 && box.b - e.y < 18) {
        e.alive = false;
        p.vy = -BOUNCE;
        g.score += 200;
        fx.onStomp();
        if (!fx.reduced) {
          fx.juice.hitstop.trigger(0.05);
          fx.juice.shake.trigger(0.1, 3);
          fx.juice.burst(
            e.x - g.cam + e.w / 2,
            e.y + e.h / 2,
            10,
            "#ff6b6b",
            2,
          );
        }
      } else if (p.invuln <= 0) return die(g, fx);
    }
  }

  const f = g.lv.finish;
  if (!g.finishCleared && box.r > f.x && box.l < f.x + f.w) {
    g.finishCleared = true;
    reportGameSession({
      gameId: "car-adventure",
      score: g.score,
      levelIndex: g.levelIndex,
      cleared: true,
      flawless: g.lives === fx.levelStartLives,
      collectedAll: g.taken >= g.lv.total,
    });
    if (g.levelIndex >= CAR_ADVENTURE_LEVELS.length - 1) {
      fx.onWin();
      fx.setStatus("won");
    } else {
      fx.onCoin();
      const next = Math.min(g.levelIndex + 1, CAR_ADVENTURE_LEVELS.length - 1);
      applyAdvanceLevel(g, next);
      fx.onAdvanceLevel(next);
    }
  }

  g.cam = Math.max(0, Math.min(g.lv.worldW - VW, p.x + p.w / 2 - VW / 2));
}
