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

/** 撞碎可破壞磚得分。 */
const BREAK_SCORE = 50;
/** hopper 彈跳初速與間隔。 */
const HOP_SPEED = 520;
const HOP_INTERVAL = 1.4;
/** floater 浮動頻率與幅度。 */
const FLOAT_FREQ = 3;
const FLOAT_AMP = 14;

function solidAt(g: GameState, tx: number, ty: number): boolean {
  const k = `${tx},${ty}`;
  if (g.lv.solid.has(k)) return true;
  // 未撞碎的可破壞磚視為實心（既有關卡 breakable 為空 → 行為不變）。
  return g.lv.breakable.has(k) && !g.broken.has(k);
}

/** 頭頂由下往上撞碎可破壞磚（D4：不需能力；不改實心／既有分支）。 */
function breakTileIfPossible(
  g: GameState,
  tx: number,
  ty: number,
  fx: PhysicsCallbacks,
): void {
  const k = `${tx},${ty}`;
  if (g.lv.solid.has(k) || !g.lv.breakable.has(k) || g.broken.has(k)) return;
  g.broken.add(k);
  g.score += BREAK_SCORE;
  if (!fx.reduced) {
    fx.juice.burst(
      tx * TILE + TILE / 2 - g.cam,
      ty * TILE + TILE / 2,
      8,
      "#d9a566",
      2,
    );
    fx.juice.shake.trigger(0.06, 2);
  }
}

/**
 * 移動平台：往復移動、承載站上玩家、實心 AABB 阻擋。
 * `reduced` 時平台靜止於起點 `x0/y0`（守動效紅線；起點為可站點，關卡仍可通）。
 */
function updateMovingPlatforms(
  g: GameState,
  dt: number,
  reduced: boolean,
): void {
  const p = g.player;
  for (const pf of g.lv.movingPlatforms) {
    let pdx = 0;
    let pdy = 0;
    if (reduced) {
      pf.x = pf.x0;
      pf.y = pf.y0;
    } else if (pf.speed > 0 && pf.range > 0) {
      if (pf.axis === "x") {
        let nx = pf.x + pf.dir * pf.speed * dt;
        if (nx > pf.x0 + pf.range) {
          nx = pf.x0 + pf.range;
          pf.dir = -1;
        } else if (nx < pf.x0) {
          nx = pf.x0;
          pf.dir = 1;
        }
        pdx = nx - pf.x;
        pf.x = nx;
      } else {
        let ny = pf.y + pf.dir * pf.speed * dt;
        if (ny > pf.y0 + pf.range) {
          ny = pf.y0 + pf.range;
          pf.dir = -1;
        } else if (ny < pf.y0) {
          ny = pf.y0;
          pf.dir = 1;
        }
        pdy = ny - pf.y;
        pf.y = ny;
      }
    }

    const fl = pf.x;
    const fr = pf.x + pf.w;
    const ft = pf.y;
    const fb = pf.y + pf.h;

    // 承載：腳貼近平台頂面且未上升 → 隨平台位移。
    const horizOverlap = p.x + p.w > fl && p.x < fr;
    if (horizOverlap && Math.abs(p.y + p.h - ft) <= 6 && p.vy >= 0) {
      p.x += pdx;
      p.y = ft - p.h + pdy;
      p.onGround = true;
      p.vy = 0;
      continue;
    }

    // 實心 AABB 解析（最小穿透軸；擋穿／側推／頭頂）。
    const nl = p.x;
    const nr = p.x + p.w;
    const nt = p.y;
    const nb = p.y + p.h;
    if (nr > fl && nl < fr && nb > ft && nt < fb) {
      const ox = Math.min(nr, fr) - Math.max(nl, fl);
      const oy = Math.min(nb, fb) - Math.max(nt, ft);
      if (oy <= ox) {
        if (nt + p.h / 2 < ft + pf.h / 2) {
          p.y = ft - p.h;
          if (p.vy > 0) p.vy = 0;
          p.onGround = true;
        } else {
          p.y = fb;
          if (p.vy < 0) p.vy = 0;
        }
      } else {
        p.x = nl + p.w / 2 < fl + pf.w / 2 ? fl - p.w : fr;
        p.vx = 0;
      }
    }
  }
}

function collide(g: GameState, axis: "x" | "y", fx?: PhysicsCallbacks): void {
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
      } else if (p.vy < 0) {
        // 頭頂撞：可破壞磚（非實心）撞碎，仍做天花板停頓（Mario bonk）。
        if (fx) breakTileIfPossible(g, tx, ty, fx);
        p.y = (ty + 1) * TILE;
      }
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
  collide(g, "y", fx);
  updateMovingPlatforms(g, dt, fx.reduced);
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
    if (e.kind === "hopper") {
      // 定點彈跳：重力落地後每隔 HOP_INTERVAL 彈起。
      e.vy = Math.min(MAXFALL, e.vy + GRAV * dt);
      e.y += e.vy * dt;
      const belowTy = Math.floor((e.y + e.h + 1) / TILE);
      const cTx = Math.floor((e.x + e.w / 2) / TILE);
      if (e.vy > 0 && solidAt(g, cTx, belowTy)) {
        e.y = belowTy * TILE - e.h;
        e.vy = 0;
        e.hopTimer -= dt;
        if (e.hopTimer <= 0) {
          e.vy = -HOP_SPEED;
          e.hopTimer = HOP_INTERVAL;
        }
      }
    } else if (e.kind === "floater") {
      // 飄浮：定 x、沿 baseY 上下浮動（不可踩＝危險）。
      e.t += dt;
      e.y = e.baseY + Math.sin(e.t * FLOAT_FREQ) * FLOAT_AMP;
    } else {
      // patrol（既有水平巡邏，行為零變更）。
      e.x += e.vx * e.dir * dt;
      const footTx = Math.floor((e.x + (e.dir > 0 ? e.w + 2 : -2)) / TILE);
      const footTy = Math.floor((e.y + e.h + 2) / TILE);
      const wallTy = Math.floor((e.y + e.h / 2) / TILE);
      const wallTx = Math.floor((e.x + (e.dir > 0 ? e.w + 1 : -1)) / TILE);
      if (!solidAt(g, footTx, footTy) || solidAt(g, wallTx, wallTy)) {
        e.dir *= -1;
        e.x += e.vx * e.dir * dt;
      }
    }

    if (
      box.r > e.x &&
      box.l < e.x + e.w &&
      box.b > e.y &&
      box.t < e.y + e.h
    ) {
      // floater 不可踩：任何接觸都受傷。
      const stompable = e.kind !== "floater";
      if (stompable && p.vy > 0 && box.b - e.y < 18) {
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
