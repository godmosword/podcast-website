import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { test, expect, type Page } from "@playwright/test";

/**
 * 繽紛樂園黃金回放（計劃 §7）：固定 seed＋固定命令序列，重力凍結，逐步比對狀態。
 * - 錄製：`BLOCK_DROP_REPLAY=record`（只在抽引擎前於現行版本跑一次）
 * - 驗證：`BLOCK_DROP_REPLAY=verify`（抽引擎、拆 View 後必須逐步相同）
 * 未設環境變數時整組 skip，不進一般 e2e。
 */
const MODE = process.env.BLOCK_DROP_REPLAY;
const FIXTURE = join(__dirname, "../lib/games/block-drop/__fixtures__/replays.json");
const DIFFICULTIES = ["relaxed", "standard", "challenge"] as const;
const SPECIALS = ["classic", "rainbow"] as const;
/** 前 14 組貪婪（大量消排、升級），後 6 組隨機（到頂、救援）。 */
const CASES = Array.from({ length: 20 }, (_, i) => ({
  id: `case-${String(i + 1).padStart(2, "0")}`,
  seed: 1000 + i * 37,
  difficulty: DIFFICULTIES[i % 3]!,
  special: SPECIALS[Math.floor(i / 3) % 2]!,
  strategy: i < 14 ? ("greedy" as const) : ("random" as const),
  pieces: i < 14 ? 70 : 40,
}));

type Frame = Record<string, unknown>;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// 命令產生器用的形狀表（只用來挑落點；實際結果以遊戲錄到的狀態為準）
const SHAPES: Record<string, [number, number][][]> = {I:[[[0,1],[1,1],[2,1],[3,1]],[[2,0],[2,1],[2,2],[2,3]],[[0,2],[1,2],[2,2],[3,2]],[[1,0],[1,1],[1,2],[1,3]]],O:[[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]]],T:[[[1,0],[0,1],[1,1],[2,1]],[[1,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[2,1],[1,2]],[[1,0],[0,1],[1,1],[1,2]]],S:[[[1,0],[2,0],[0,1],[1,1]],[[1,0],[1,1],[2,1],[2,2]],[[1,1],[2,1],[0,2],[1,2]],[[0,0],[0,1],[1,1],[1,2]]],Z:[[[0,0],[1,0],[1,1],[2,1]],[[2,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[1,2],[2,2]],[[1,0],[0,1],[1,1],[0,2]]],J:[[[0,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[1,1],[1,2]],[[0,1],[1,1],[2,1],[2,2]],[[1,0],[1,1],[0,2],[1,2]]],L:[[[2,0],[0,1],[1,1],[2,1]],[[1,0],[1,1],[1,2],[2,2]],[[0,1],[1,1],[2,1],[0,2]],[[0,0],[1,0],[1,1],[1,2]]],};

/** 隨機：0–3 次旋轉（↑ 或 z）、左右位移、偶爾暫存，最後硬降（覆蓋到頂與救援）。 */
function randomPieceCommands(r: () => number): string[] {
  const out: string[] = [];
  if (r() < 0.15) out.push("c");
  const turns = Math.floor(r() * 4);
  for (let t = 0; t < turns; t++) out.push(r() < 0.75 ? "ArrowUp" : "z");
  const shift = Math.floor(r() * 9) - 4;
  for (let k = 0; k < Math.abs(shift); k++) out.push(shift < 0 ? "ArrowLeft" : "ArrowRight");
  out.push("Space");
  return out;
}

/** 貪婪：依當下盤面挑高度低、洞少、能消排的落點（覆蓋消排、連擊、彩虹、升級）。 */
function greedyPieceCommands(frame: Frame, r: () => number): string[] {
  const board = (frame.board as string[]).map((row) => [...row].map((c) => c !== "."));
  const active = frame.active as { type: string; rot: number; x: number } | null;
  if (!active) return ["Space"];
  const rows = board.length;
  const cols = board[0]!.length;
  let best: { score: number; turns: number; x: number } | null = null;
  for (let turns = 0; turns < 4; turns++) {
    const shape = SHAPES[active.type]![(active.rot + turns) % 4]!;
    for (let x = -3; x < cols; x++) {
      const fits = (y: number) =>
        shape.every(([c, rr]) => {
          const cx = x + c;
          const cy = y + rr;
          return cx >= 0 && cx < cols && cy < rows && (cy < 0 || !board[cy]![cx]);
        });
      if (!fits(0)) continue;
      let y = 0;
      while (fits(y + 1)) y++;
      const next = board.map((row) => row.slice());
      shape.forEach(([c, rr]) => {
        if (y + rr >= 0) next[y + rr]![x + c] = true;
      });
      const lines = next.filter((row) => row.every(Boolean)).length;
      const kept = next.filter((row) => !row.every(Boolean));
      const heights = Array.from({ length: cols }, (_, c) => {
        const top = kept.findIndex((row) => row[c]);
        return top < 0 ? 0 : kept.length - top;
      });
      let holes = 0;
      for (let c = 0; c < cols; c++) {
        let seen = false;
        for (const row of kept) {
          if (row[c]) seen = true;
          else if (seen) holes++;
        }
      }
      const bump = heights.slice(1).reduce((s, h, i) => s + Math.abs(h - heights[i]!), 0);
      const score =
        -0.51 * heights.reduce((s, h) => s + h, 0) + 0.76 * lines * 4 - 0.36 * holes * 4 - 0.18 * bump + r() * 0.01;
      if (!best || score > best.score) best = { score, turns, x };
    }
  }
  if (!best) return ["Space"];
  const out: string[] = [];
  for (let t = 0; t < best.turns; t++) out.push("ArrowUp");
  const shift = best.x - active.x;
  for (let k = 0; k < Math.abs(shift); k++) out.push(shift < 0 ? "ArrowLeft" : "ArrowRight");
  out.push("Space");
  return out;
}

async function rafs(page: Page, n = 2) {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let left = count;
        const step = () => (--left <= 0 ? resolve() : requestAnimationFrame(step));
        requestAnimationFrame(step);
      }),
    n,
  );
}

async function snapshot(page: Page): Promise<Frame> {
  return page.evaluate(() => (window as unknown as { __blockDropSnapshot: () => Frame }).__blockDropSnapshot());
}

async function settled(page: Page): Promise<Frame> {
  await rafs(page, 2);
  for (let i = 0; i < 80; i++) {
    const s = await snapshot(page);
    if (!s.clearing) {
      await rafs(page, 1);
      return snapshot(page);
    }
    await page.waitForTimeout(25);
  }
  throw new Error("消行動畫沒有結束");
}

async function runCase(page: Page, c: (typeof CASES)[number], replay?: string[]) {
  await page.addInitScript(
    ({ seed, difficulty, special }) => {
      (window as unknown as { __blockDropSeed: number }).__blockDropSeed = seed;
      localStorage.setItem(
        "cheche:progress",
        JSON.stringify({
          preferences: {
            theme: "light",
            gameKit: {
              kidsMode: true,
              blockDropDifficulty: difficulty,
              blockDropSpecialMode: special,
              gameVolume: 0,
              motionPreference: "off",
            },
          },
        }),
      );
      localStorage.setItem(
        "cheche:block-drop-tutorial-v1",
        JSON.stringify({ move: true, rotate: true, line: true }),
      );
    },
    { seed: c.seed, difficulty: c.difficulty, special: c.special },
  );
  await page.goto("/games/block-drop");
  await page.getByRole("button", { name: "自由堆疊" }).click();
  await expect(page.locator('[data-status="playing"]')).toBeVisible();
  const frames: Frame[] = [await settled(page)];
  const used: string[] = [];
  const press = async (key: string) => {
    await page.keyboard.press(key === "Space" ? " " : key);
    used.push(key);
    const frame = await settled(page);
    // 位移與旋轉只記當前方塊；硬降與暫存記完整狀態
    frames.push(key === "Space" || key === "c" ? frame : { active: frame.active, status: frame.status });
    return frame;
  };
  if (replay) {
    for (const key of replay) await press(key);
    return { config: c, commands: used, frames };
  }
  const r = rng(c.seed * 31 + 7);
  let full = frames[0]!;
  for (let p = 0; p < c.pieces && full.status === "playing"; p++) {
    const keys = c.strategy === "greedy" ? greedyPieceCommands(full, r) : randomPieceCommands(r);
    for (const key of keys) {
      const frame = await press(key);
      if (frame.status !== "playing") break;
      if (key === "Space" || key === "c") full = frame;
    }
    full = frames.filter((f) => "board" in f).at(-1) ?? full;
  }
  return { config: c, commands: used, frames };
}

test.describe("繽紛樂園黃金回放", () => {
  test.skip(!MODE, "設 BLOCK_DROP_REPLAY=record 或 verify 才跑");
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1280, height: 800 } });

  const recorded: Record<string, unknown> = {};

  for (const c of CASES) {
    test(c.id, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      if (MODE === "record") {
        recorded[c.id] = await runCase(page, c);
        return;
      }
      type Recorded = Awaited<ReturnType<typeof runCase>>;
      const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as Record<string, Recorded>;
      const expected = fixture[c.id];
      expect(expected, `${c.id} 沒有錄製資料`).toBeTruthy();
      const result = await runCase(page, c, expected!.commands);
      expect(result.commands).toEqual(expected!.commands);
      result.frames.forEach((frame, i) => {
        expect(frame, `${c.id} 第 ${i} 步`).toEqual(expected!.frames[i]);
      });
      expect(result.frames.length).toBe(expected!.frames.length);
    });
  }

  test.afterAll(() => {
    if (MODE !== "record" || Object.keys(recorded).length === 0) return;
    if (!existsSync(dirname(FIXTURE))) mkdirSync(dirname(FIXTURE), { recursive: true });
    writeFileSync(FIXTURE, `${JSON.stringify(recorded)}\n`);
  });
});
