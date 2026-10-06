/**
 * 《繽紛樂園》任務冒險玩家策略模擬（計劃「可解」第 3 點）。
 * 直接驅動規則引擎（救援、塊數、完成判定都與遊戲相同），玩家以「目標進度＋盤面啟發式」挑落點，
 * 加上隨機失誤與時間壓力：思考時間超過方塊落到底的時間，就提高失誤率。
 * 模擬結果是調校依據，不等於孩子試玩的可玩性證明。
 */

import { freshGame, hardDrop, holdPiece, tick, beginGame, type EngineContext, type GameState } from "./engine";
import { boardFeatures, listPlacements, type Placement } from "./placement";
import { buildStageStart } from "./board-gen";
import { scoreSearchState } from "./solver";
import { seededRng, pickIndex, type Rng } from "./rng";
import { stageEngineConfig, blockStars, type BlockRound } from "./stages";
import { CLEAR_ANIM_MS } from "./scoring";
import { valid } from "./pieces";

export type BlockPolicy = {
  name: string;
  /** 每塊思考秒數 */
  thinkSeconds: number;
  /** 分數加上的雜訊溫度（越大越隨機） */
  temperature: number;
  /** 直接隨便放的機率 */
  mistake: number;
  /** 會不會用暫存 */
  usesHold: boolean;
};

export const BLOCK_POLICIES: Readonly<Record<"kid" | "skilled", BlockPolicy>> = {
  kid: { name: "孩子式", thinkSeconds: 3.5, temperature: 6, mistake: 0.2, usesHold: false },
  skilled: { name: "有點技巧", thinkSeconds: 1.6, temperature: 1.5, mistake: 0.05, usesHold: true },
};

export type BlockSimResult = {
  won: boolean;
  pieces: number;
  rescues: number;
  stars: number;
  seconds: number;
  overReason: GameState["overReason"];
};

const ANIM_SECONDS_PER_PIECE = 0.35;

function choosePlacement(
  g: GameState,
  round: BlockRound,
  policy: BlockPolicy,
  rng: Rng,
  rushed: boolean,
): Placement | null {
  const type = g.active!.type;
  const options = listPlacements(g.board, type);
  if (options.length === 0) return null;
  const mistake = Math.min(0.9, policy.mistake + (rushed ? 0.35 : 0));
  if (rng() < mistake) return options[pickIndex(options.length, rng)]!;
  const initialStones = round.stage.stones.length;
  let best: Placement | null = null;
  let bestScore = -Infinity;
  for (const p of options) {
    const s = {
      board: p.board,
      hold: g.hold,
      idx: 0,
      lines: g.lines + p.lines,
      stoneRowsCleared: g.stoneRowsCleared + p.stoneRows,
      multiClears: g.multiClears + (p.lines >= 2 ? 1 : 0),
      pieces: g.pieces + 1,
    };
    const score = scoreSearchState(round.stage.goals, s, initialStones, round.stage.rows) + (rng() - 0.5) * policy.temperature;
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

/** 從出生點到落點要掉幾格（估算孩子能思考多久）。 */
function fallRows(p: Placement): number {
  return Math.max(1, p.y);
}

export function simulateBlockRound(round: BlockRound, policy: BlockPolicy, seed: number, maxPieces = 80): BlockSimResult {
  const rng = seededRng(seed * 7919 + 13);
  const ctx: EngineContext = { config: stageEngineConfig(round), rng: seededRng(seed), events: [] };
  const g = freshGame(round.stage.cols, round.stage.rows, buildStageStart(round.stage));
  beginGame(g, ctx);
  const rowMs = (round.stage.fallSeconds * 1000) / round.stage.rows;
  let now = 0;
  let seconds = 0;
  let guard = 0;
  while (g.status === "playing" && guard++ < maxPieces * 3) {
    if (!g.active) break;
    if (policy.usesHold && round.stage.hold && g.canHold) {
      // 有暫存時比較「現在這塊」與「換出來那塊」哪個落點分數高
      const here = choosePlacement(g, round, { ...policy, mistake: 0 }, rng, false);
      const holdType = g.hold;
      if (holdType && here) {
        const swap = listPlacements(g.board, holdType).map((p) => boardFeatures(p.board).holes - p.lines * 3);
        const cur = boardFeatures(here.board).holes - here.lines * 3;
        if (Math.min(...swap) < cur - 1) holdPiece(g, ctx);
      }
    }
    const preview = choosePlacement(g, round, { ...policy, mistake: 0, temperature: 0 }, rng, false);
    const available = round.stage.autoFall && preview ? (fallRows(preview) * rowMs) / 1000 : Infinity;
    const rushed = policy.thinkSeconds > available;
    const choice = choosePlacement(g, round, policy, rng, rushed);
    if (!choice) break;
    const target = { ...g.active, rot: choice.rot, x: choice.x, y: 0 };
    if (valid(target, g.board)) g.active = target;
    seconds += Math.min(policy.thinkSeconds, available) + ANIM_SECONDS_PER_PIECE;
    now += 1000;
    hardDrop(g, ctx, now);
    if (g.clearing) {
      now += CLEAR_ANIM_MS;
      seconds += CLEAR_ANIM_MS / 1000;
      tick(g, ctx, CLEAR_ANIM_MS, now);
    }
    ctx.events = [];
    if (g.pieces >= maxPieces) break;
  }
  const won = g.status === "won";
  return {
    won,
    pieces: g.pieces,
    rescues: g.rescues,
    stars: won ? blockStars(round.stage, g).stars : 0,
    seconds,
    overReason: g.overReason,
  };
}

export type BlockSimSummary = {
  samples: number;
  winRate: number;
  medianPieces: number;
  medianSeconds: number;
  /** 輕鬆：≤2 次救援內完成的比例 */
  withinTwoRescues: number;
  avgRescues: number;
  threeStarRate: number;
};

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : 0;
};

export function simulateBlockMany(round: BlockRound, policy: BlockPolicy, seeds: number, firstSeed = 1): BlockSimSummary {
  const results: BlockSimResult[] = [];
  for (let i = 0; i < seeds; i++) results.push(simulateBlockRound(round, policy, firstSeed + i));
  const wins = results.filter((r) => r.won);
  const n = results.length || 1;
  return {
    samples: results.length,
    winRate: wins.length / n,
    medianPieces: median(wins.map((r) => r.pieces)),
    medianSeconds: median(wins.map((r) => r.seconds)),
    withinTwoRescues: results.filter((r) => r.won && r.rescues <= 2).length / n,
    avgRescues: results.reduce((s, r) => s + r.rescues, 0) / n,
    threeStarRate: results.filter((r) => r.stars === 3).length / n,
  };
}
