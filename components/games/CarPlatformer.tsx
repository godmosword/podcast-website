"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type RefObject,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { JuiceController } from "@/lib/gamekit/juice";
import {
  BarTouchButton,
  touchControlStyles,
  useBestScore,
  useFixedGameLoop,
  useGameAudio,
  useTouchControls,
  useVisibilityPause,
} from "@/lib/game-kit";
import PixelGameCanvas, {
  usePixelGameSurface,
} from "@/components/games/PixelGameCanvas";
import { drawPixelText } from "@/lib/gamekit/style";
import {
  drawAdventureCoin,
  drawAdventureGroundTile,
  drawAdventureSpike,
} from "@/lib/gamekit/tileset-draw";
import {
  levelFromJson,
  type AdventureLevel,
} from "@/lib/gamekit/adventure-level";
import { CAR_ADVENTURE_LEVELS } from "@/lib/games/car-adventure/levels";
import { reportGameSession } from "@/lib/gamekit/session";
import GameChrome, { GameChromeToolbar } from "@/components/games/GameChrome";
import { useGameKitSettings } from "@/hooks/useGameKitSettings";

const TILE = 36;
const VW = 720;
const VH = 432;
const KIT_W = 320;
const KIT_H = 180;
const RENDER_SX = KIT_W / VW;
const RENDER_SY = KIT_H / VH;
const ROWS = 12;
const GRAV = 2000;
const MOVE = 1700;
const MAXVX = 235;
const FRICTION = 1600;
const JUMP = 720;
const MAXFALL = 920;
const COYOTE = 0.09;
const BUFFER = 0.12;
const BOUNCE = 440;
const INVULN = 1.4;
type Status = "ready" | "playing" | "paused" | "won" | "over";
interface Input {
  left: boolean;
  right: boolean;
  jump: boolean;
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
}
interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  dir: number;
  alive: boolean;
}
interface GameState {
  lv: AdventureLevel;
  levelIndex: number;
  player: Player;
  cam: number;
  score: number;
  lives: number;
  taken: number;
  input: Input;
  last: number | null;
  finishCleared: boolean;
  prevPlayer: { x: number; y: number };
  renderAlpha: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const approach = (v: number, target: number, amt: number) =>
  v > target ? Math.max(target, v - amt) : Math.min(target, v + amt);

function loadAdventureLevel(index: number): AdventureLevel {
  const json =
    CAR_ADVENTURE_LEVELS[
      Math.max(0, Math.min(index, CAR_ADVENTURE_LEVELS.length - 1))
    ];
  return levelFromJson(json);
}

const primaryBtn: CSSProperties = {
  marginTop: 4,
  border: "none",
  background: "linear-gradient(180deg,#ffd23f,#ffa600)",
  color: "#4a2c00",
  fontWeight: 800,
  fontSize: 20,
  padding: "12px 30px",
  borderRadius: 16,
  cursor: "pointer",
  boxShadow: "0 5px 0 #b97600",
};

function CarPlatformerCanvas({
  game,
  statusRef,
  juiceRef,
  reset,
  update,
  render,
  drawHud,
  reducedRef,
}: {
  game: RefObject<GameState | null>;
  statusRef: RefObject<Status>;
  juiceRef: RefObject<JuiceController>;
  reset: () => void;
  update: (g: GameState, dt: number) => void;
  render: (ctx: CanvasRenderingContext2D, g: GameState) => void;
  drawHud: (ctx: CanvasRenderingContext2D, g: GameState) => void;
  reducedRef: RefObject<boolean>;
}) {
  const { rendererRef, present } = usePixelGameSurface();
  const skipPhysicsRef = useRef(false);

  useEffect(() => {
    reset();
  }, [reset]);

  useFixedGameLoop(
    {
      fixedUpdate: (dt) => {
        const g = game.current;
        if (!g || statusRef.current !== "playing" || skipPhysicsRef.current) {
          skipPhysicsRef.current = false;
          return;
        }
        g.prevPlayer = { x: g.player.x, y: g.player.y };
        update(g, dt);
      },
      render: (alpha) => {
        const renderer = rendererRef.current;
        const g = game.current;
        if (!renderer || !g) return;

        const reduced = reducedRef.current;
        const j = reduced
          ? { shakeX: 0, shakeY: 0, skipLogic: false }
          : juiceRef.current.update(1 / 60);
        if (j.skipLogic) skipPhysicsRef.current = true;

        g.renderAlpha = alpha;
        const ctx = renderer.context;
        renderer.clear("#8fd3ff");
        ctx.save();
        ctx.scale(RENDER_SX, RENDER_SY);
        ctx.translate(j.shakeX / RENDER_SX, j.shakeY / RENDER_SY);
        render(ctx, g);
        if (!reduced) juiceRef.current.draw(ctx);
        ctx.restore();
        drawHud(ctx, g);
        present();
      },
    },
    true,
  );

  return null;
}

export default function CarPlatformer() {
  const game = useRef<GameState | null>(null);
  const juiceRef = useRef(new JuiceController());
  const statusRef = useRef<Status>("ready");
  const isCoarse = useCoarsePointer();
  const reducedRef = useRef(false);
  const reduced = useReducedMotion();
  const { useKeyboardInput } = useTouchControls();
  const { best, saveBest } = useBestScore("car-adventure");

  const [status, setStatus] = useState<Status>("ready");
  const { kidsMode } = useGameKitSettings();
  const [levelIndex, setLevelIndex] = useState(0);
  const [announce, setAnnounce] = useState("");
  const levelIndexRef = useRef(0);
  const levelStartLivesRef = useRef(3);
  const kidsModeRef = useRef(kidsMode);
  kidsModeRef.current = kidsMode;
  const {
    ensureAudio,
    tone,
    soundUi,
    toggleSound,
    playBgm,
    stopBgm,
    pauseBgm,
    resumeBgm,
  } = useGameAudio("car-adventure");

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const setStat = useCallback(
    (s: Status) => {
      if (
        (s === "won" || s === "over") &&
        game.current &&
        (best == null || game.current.score > best)
      ) {
        void saveBest(game.current.score);
      }
      statusRef.current = s;
      setStatus(s);
    },
    [best, saveBest],
  );

  const sJump = () => tone(520, 0.12, "square", 0.04);
  const sCoin = () => tone(880, 0.08, "triangle", 0.05);
  const sStomp = () => tone(300, 0.1, "square", 0.05);
  const sHurt = () => tone(180, 0.3, "sawtooth", 0.06);
  const sWin = () =>
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => tone(f, 0.2, "triangle", 0.06), i * 130),
    );

  const reset = useCallback((idx = levelIndexRef.current) => {
    const lv = loadAdventureLevel(idx);
    const startLives = kidsModeRef.current ? 5 : 3;
    game.current = {
      lv,
      levelIndex: idx,
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
      },
      cam: 0,
      score: 0,
      lives: startLives,
      taken: 0,
      input: { left: false, right: false, jump: false },
      last: null,
      finishCleared: false,
      prevPlayer: { x: lv.start.x, y: lv.start.y },
      renderAlpha: 1,
    };
    levelStartLivesRef.current = startLives;
  }, []);

  const begin = useCallback(() => {
    ensureAudio();
    reset(levelIndexRef.current);
    setStat("playing");
  }, [ensureAudio, reset, setStat]);

  const beginLevel = useCallback(
    (idx: number) => {
      levelIndexRef.current = idx;
      setLevelIndex(idx);
      ensureAudio();
      reset(idx);
      setStat("playing");
    },
    [ensureAudio, reset, setStat],
  );

  const advanceLevel = useCallback(() => {
    const g = game.current;
    if (!g) return;
    const next = Math.min(g.levelIndex + 1, CAR_ADVENTURE_LEVELS.length - 1);
    levelIndexRef.current = next;
    setLevelIndex(next);
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
    };
    g.cam = 0;
    g.taken = 0;
    g.last = null;
    g.finishCleared = false;
    g.prevPlayer = { x: lv.start.x, y: lv.start.y };
    g.renderAlpha = 1;
    levelStartLivesRef.current = g.lives;
    statusRef.current = "playing";
    setStatus("playing");
  }, []);

  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") {
      setAnnounce("遊戲已暫停");
      setStat("paused");
    } else if (statusRef.current === "paused") {
      if (game.current) game.current.last = null;
      setAnnounce("繼續遊戲");
      setStat("playing");
    }
  }, [setStat]);

  useKeyboardInput(
    (input) => {
      const g = game.current;
      if (!g) return;
      if (statusRef.current === "playing") {
        if (input.wasPressed("pause")) {
          togglePause();
          return;
        }
        g.input.left = input.isHeld("move-left");
        g.input.right = input.isHeld("move-right");
        g.input.jump = input.isHeld("move-up") || input.isHeld("action");
      } else if (statusRef.current === "paused" && input.wasPressed("pause")) {
        togglePause();
      } else if (
        (statusRef.current === "ready" ||
          statusRef.current === "won" ||
          statusRef.current === "over") &&
        input.wasPressed("confirm")
      ) {
        begin();
      }
    },
    status === "playing" || status === "paused" || status === "ready" || status === "won" || status === "over",
  );

  const solidAt = (g: GameState, tx: number, ty: number) =>
    g.lv.solid.has(`${tx},${ty}`);

  const collide = (g: GameState, axis: "x" | "y") => {
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
  };

  const overlapsTileSet = (
    set: Set<string>,
    box: { l: number; r: number; t: number; b: number },
  ) => {
    const x0 = Math.floor(box.l / TILE);
    const x1 = Math.floor((box.r - 0.01) / TILE);
    const y0 = Math.floor(box.t / TILE);
    const y1 = Math.floor((box.b - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++)
        if (set.has(`${tx},${ty}`)) return true;
    return false;
  };

  const die = (g: GameState) => {
    sHurt();
    if (!reducedRef.current) juiceRef.current.shake.trigger(0.22, 6);
    g.lives--;
    if (g.lives <= 0) {
      if (statusRef.current !== "over") {
        reportGameSession({
          gameId: "car-adventure",
          score: g.levelIndex,
        });
      }
      setStat("over");
      return;
    }
    const p = g.player;
    p.x = g.lv.start.x;
    p.y = g.lv.start.y;
    p.vx = 0;
    p.vy = 0;
    p.invuln = INVULN;
    g.cam = 0;
  };

  const update = (g: GameState, dt: number) => {
    const p = g.player;
    const inp = g.input;
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
      p.jumpBuf = BUFFER;
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
      p.vy = -JUMP;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      p.jumpCut = false;
      sJump();
    }
    p.vy = Math.min(MAXFALL, p.vy + GRAV * dt);

    p.x += p.vx * dt;
    collide(g, "x");
    p.y += p.vy * dt;
    p.onGround = false;
    collide(g, "y");
    if (p.onGround) p.coyote = COYOTE;
    if (p.invuln > 0) p.invuln -= dt;

    const box = { l: p.x, r: p.x + p.w, t: p.y, b: p.y + p.h };
    if (overlapsTileSet(g.lv.spikes, box)) return die(g);
    if (p.y > g.lv.worldH + 80) return die(g);

    for (const c of g.lv.coins) {
      if (c.taken) continue;
      if (
        Math.abs(c.x - (p.x + p.w / 2)) < 20 &&
        Math.abs(c.y - (p.y + p.h / 2)) < 22
      ) {
        c.taken = true;
        g.taken++;
        g.score += 100;
        sCoin();
        if (!reducedRef.current) {
          juiceRef.current.burst(c.x - g.cam, c.y, 8, "#ffc107", 2);
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
          sStomp();
          if (!reducedRef.current) {
            juiceRef.current.hitstop.trigger(0.05);
            juiceRef.current.shake.trigger(0.1, 3);
            juiceRef.current.burst(
              e.x - g.cam + e.w / 2,
              e.y + e.h / 2,
              10,
              "#ff6b6b",
              2,
            );
          }
        } else if (p.invuln <= 0) return die(g);
      }
    }

    const f = g.lv.finish;
    if (!g.finishCleared && box.r > f.x && box.l < f.x + f.w) {
      g.finishCleared = true;
      const levelScore = g.levelIndex + 1;
      reportGameSession({
        gameId: "car-adventure",
        score: levelScore,
        levelIndex: g.levelIndex,
        cleared: true,
        flawless: g.lives === levelStartLivesRef.current,
        collectedAll: g.taken >= g.lv.total,
      });
      if (g.levelIndex >= CAR_ADVENTURE_LEVELS.length - 1) {
        sWin();
        setStat("won");
      } else {
        sCoin();
        advanceLevel();
      }
    }

    g.cam = Math.max(
      0,
      Math.min(g.lv.worldW - VW, p.x + p.w / 2 - VW / 2),
    );
  };

  const rr = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const cloud = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.arc(x + 18, y + 4, 13, 0, Math.PI * 2);
    ctx.arc(x - 16, y + 5, 12, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawCar = (
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    w: number,
    h: number,
    body: string,
    roof: string,
    facing: number,
  ) => {
    ctx.save();
    ctx.translate(sx + w / 2, sy + h / 2);
    if (facing < 0) ctx.scale(-1, 1);
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222831";
    [w * 0.27, w * 0.75].forEach((wx) => {
      ctx.beginPath();
      ctx.arc(wx, h - 3, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#9aa3b2";
    [w * 0.27, w * 0.75].forEach((wx) => {
      ctx.beginPath();
      ctx.arc(wx, h - 3, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = body;
    rr(ctx, 1, h * 0.4, w - 2, h * 0.45, 6);
    ctx.fill();
    ctx.fillStyle = roof;
    rr(ctx, w * 0.28, h * 0.1, w * 0.46, h * 0.4, 6);
    ctx.fill();
    ctx.fillStyle = "#bfe8ff";
    rr(ctx, w * 0.34, h * 0.17, w * 0.34, h * 0.26, 4);
    ctx.fill();
    ctx.fillStyle = "#fff3b0";
    ctx.beginPath();
    ctx.arc(w - 4, h * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const render = (ctx: CanvasRenderingContext2D, g: GameState) => {
    const cam = g.cam;
    const px = reducedRef.current ? 0 : cam;
    const sky = ctx.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, "#8fd3ff");
    sky.addColorStop(1, "#dff3ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    for (let i = 0; i < 8; i++) {
      const cx =
        (((i * 260 - px * 0.2) % (VW + 260)) + (VW + 260)) % (VW + 260) - 130;
      cloud(ctx, cx, 50 + (i % 3) * 36);
    }
    ctx.fillStyle = "#7fc98a";
    for (let i = 0; i < 12; i++) {
      const hx =
        (((i * 220 - px * 0.45) % (VW + 220)) + (VW + 220)) % (VW + 220) -
        110;
      ctx.beginPath();
      ctx.moveTo(hx, VH);
      ctx.quadraticCurveTo(hx + 110, VH - 150, hx + 220, VH);
      ctx.fill();
    }

    const tx0 = Math.floor(cam / TILE) - 1;
    const tx1 = Math.floor((cam + VW) / TILE) + 1;
    for (let ty = 0; ty < ROWS; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        if (!g.lv.solid.has(`${tx},${ty}`)) continue;
        const sx = tx * TILE - cam;
        const sy = ty * TILE;
        drawAdventureGroundTile(
          ctx,
          sx,
          sy,
          TILE,
          !g.lv.solid.has(`${tx},${ty - 1}`),
        );
      }

    for (const key of g.lv.spikes) {
      const [tx, ty] = key.split(",").map(Number);
      drawAdventureSpike(ctx, tx * TILE - cam, ty * TILE, TILE);
    }

    for (const c of g.lv.coins) {
      if (c.taken) continue;
      drawAdventureCoin(ctx, c.x - cam, c.y, 9);
    }

    const f = g.lv.finish;
    const fx = f.x - cam;
    ctx.fillStyle = "#888";
    ctx.fillRect(fx + TILE / 2 - 2, f.y - 8, 4, f.h + 8);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = (i + j) % 2 ? "#fff" : "#ff5252";
        ctx.fillRect(fx + TILE / 2 + 2 + j * 8, f.y - 6 + i * 8, 8, 8);
      }

    for (const e of g.lv.enemies)
      if (e.alive)
        drawCar(ctx, e.x - cam, e.y, e.w, e.h, "#ff6b6b", "#d64545", e.dir);

    const p = g.player;
    const drawX = lerp(g.prevPlayer.x, p.x, g.renderAlpha);
    const drawY = lerp(g.prevPlayer.y, p.y, g.renderAlpha);
    if (!(p.invuln > 0 && Math.floor(p.invuln * 12) % 2))
      drawCar(ctx, drawX - cam, drawY, p.w, p.h, "#ffd23f", "#e0a800", p.facing);

  };

  const drawHud = (ctx: CanvasRenderingContext2D, g: GameState) => {
    drawPixelText(ctx, `SC ${g.score}`, 8, 6, { scale: 1, shadow: true });
    drawPixelText(ctx, `C ${g.taken}/${g.lv.total}`, 8, 18, { scale: 1 });
    drawPixelText(ctx, `HP ${g.lives}`, 8, 30, { scale: 1 });
    drawPixelText(
      ctx,
      `L${g.levelIndex + 1}/${CAR_ADVENTURE_LEVELS.length}`,
      8,
      42,
      { scale: 1 },
    );
  };

  useEffect(() => {
    if (status === "playing" && game.current) game.current.last = null;
  }, [status]);

  useEffect(() => {
    if (status === "playing") playBgm();
    else if (status === "paused") pauseBgm();
    else stopBgm();
  }, [status, playBgm, pauseBgm, stopBgm]);

  useVisibilityPause({
    onHidden: () => {
      pauseBgm();
      if (statusRef.current === "playing") setStat("paused");
    },
    onVisible: () => {
      if (statusRef.current === "playing") resumeBgm();
    },
  });

  useEffect(() => {
    const set = (k: string, v: boolean) => {
      const g = game.current;
      if (!g) return;
      if (k === "ArrowLeft" || k === "a" || k === "A") g.input.left = v;
      else if (k === "ArrowRight" || k === "d" || k === "D") g.input.right = v;
      else if (k === "ArrowUp" || k === "w" || k === "W" || k === " ")
        g.input.jump = v;
    };
    const onDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(e.key))
        e.preventDefault();
      const s = statusRef.current;
      if (
        (s === "ready" || s === "won" || s === "over") &&
        (e.key === " " || e.key === "Enter")
      ) {
        begin();
        return;
      }
      if (
        (e.key === "p" || e.key === "P") &&
        (s === "playing" || s === "paused")
      ) {
        togglePause();
        return;
      }
      if (s !== "playing") return;
      set(e.key, true);
    };
    const onUp = (e: KeyboardEvent) => set(e.key, false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [begin, togglePause]);

  const hold =
    (key: keyof Input, v: boolean) => () => {
      const g = game.current;
      if (g) g.input[key] = v;
    };

  return (
    <GameChrome
      canPause={status === "playing" || status === "paused"}
      paused={status === "paused"}
      onPause={() => {
        if (statusRef.current === "playing") togglePause();
      }}
      onResume={() => {
        if (statusRef.current === "paused") togglePause();
      }}
      onRestart={begin}
      announce={announce}
    >
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        fontFamily:
          "var(--font-sans,'PingFang TC','Microsoft JhengHei',system-ui,sans-serif)",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: "#15428f" }}>
          🏁 車車大冒險 {kidsMode ? "🧒" : ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {(best ?? 0) > 0 && (
            <span
              style={{ fontSize: 14, fontWeight: 700, color: "#3a5a8c" }}
              aria-label={`最佳得分 ${best}`}
            >
              最佳 ⭐ {best ?? 0}
            </span>
          )}
          <GameChromeToolbar
            canPause={status === "playing" || status === "paused"}
            paused={status === "paused"}
            onPause={() => {
              if (statusRef.current === "playing") togglePause();
            }}
            onResume={() => {
              if (statusRef.current === "paused") togglePause();
            }}
            soundOn={soundUi}
            onToggleSound={toggleSound}
          />
        </div>
      </div>

      <PixelGameCanvas gameId="car-adventure">
        <CarPlatformerCanvas
          game={game}
          statusRef={statusRef}
          juiceRef={juiceRef}
          reset={reset}
          update={update}
          render={render}
          drawHud={drawHud}
          reducedRef={reducedRef}
        />
        {status !== "playing" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(12,20,40,.74)",
              backdropFilter: "blur(2px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "#fff",
              textAlign: "center",
              padding: 20,
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: 44 }}>
              {status === "won"
                ? "🏆"
                : status === "over"
                  ? "💥"
                  : status === "paused"
                    ? "⏸"
                    : "🏁"}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {status === "won"
                ? "全關卡通關！"
                : status === "over"
                  ? "再試一次吧"
                  : status === "paused"
                    ? "暫停中"
                    : "車車大冒險"}
            </div>
            {(status === "won" || status === "over") && game.current && (
              <div style={{ fontSize: 16 }}>得分 ⭐ {game.current.score}</div>
            )}
            {status === "ready" && (
              <>
                <div
                  style={{
                    fontSize: 14,
                    color: "#cdd9f0",
                    maxWidth: 320,
                    lineHeight: 1.6,
                  }}
                >
                  方向鍵移動、上鍵/空白鍵跳；踩在搗蛋車頭上可以彈飛它，吃金幣、躲尖刺、衝向終點旗！
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    width: "100%",
                    maxWidth: 280,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#a8bce8" }}>選擇關卡</div>
                  {CAR_ADVENTURE_LEVELS.map((lv, i) => (
                    <button
                      key={lv.id}
                      type="button"
                      onClick={() => {
                        levelIndexRef.current = i;
                        setLevelIndex(i);
                      }}
                      style={{
                        border:
                          levelIndex === i
                            ? "2px solid #ffd23f"
                            : "2px solid rgba(255,255,255,.25)",
                        background:
                          levelIndex === i
                            ? "rgba(255,210,63,.2)"
                            : "rgba(255,255,255,.08)",
                        color: "#fff",
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      關卡 {i + 1} · {lv.name}
                    </button>
                  ))}
                </div>
              </>
            )}
            {status === "paused" ? (
              <button type="button" onClick={togglePause} style={primaryBtn}>
                繼續 ▶
              </button>
            ) : (
              <button
                type="button"
                onClick={() => beginLevel(levelIndex)}
                style={primaryBtn}
              >
                {status === "ready" ? "開始冒險 ▶" : "再玩一次 🔁"}
              </button>
            )}
          </div>
        )}
      </PixelGameCanvas>

      <div className={touchControlStyles.touchBar}>
        <div className={touchControlStyles.touchCluster}>
          <BarTouchButton
            label="左"
            coarse={isCoarse}
            onDown={hold("left", true)}
            onUp={hold("left", false)}
          >
            ⬅️
          </BarTouchButton>
          <BarTouchButton
            label="右"
            coarse={isCoarse}
            onDown={hold("right", true)}
            onUp={hold("right", false)}
          >
            ➡️
          </BarTouchButton>
        </div>
        <BarTouchButton
          label="跳"
          big
          coarse={isCoarse}
          onDown={hold("jump", true)}
          onUp={hold("jump", false)}
        >
          ⬆️ 跳
        </BarTouchButton>
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#3a5a8c",
          fontSize: 13,
          marginTop: 10,
        }}
      >
        {isCoarse
          ? "按住左右移動 · 右側大按鈕跳躍 · 踩敵人頭可彈飛"
          : "← → / A D 移動 · ↑ / W / 空白鍵 跳（可變高度）· 踩敵人頭可彈飛 · P 暫停 · 手把支援"}
      </p>
    </div>
    </GameChrome>
  );
}
