"use client";

/**
 * 《繽紛樂園》任務冒險任務列（對齊消消樂）：取代分數格，圖＋數字為主。
 * 第一眼：本站要做什麼——迷你起始盤＋「第 N 站」、逐項目標（大圖案＋剩下的大數字，完成打勾）、
 * 挑戰模式的剩餘塊數（方塊圖示＋數字）。目標名稱與「還差幾排」整句留給讀屏。
 * 第三顆星的塊數不在局內倒數，結算時才用小籤說明；每站概念句也不放（孩子讀不懂）。
 */
import { BlockGoalIcon, IconPieces, MiniStoneBoard } from "@/components/games/BlockDropIcons";
import { IconCheck } from "@/components/games/CandyMatchIcons";
import type { GameState } from "@/lib/games/block-drop/engine";
import { blockGoalStatus, blockGoalTitle, type BlockGoal } from "@/lib/games/block-drop/goals";
import type { BlockRound } from "@/lib/games/block-drop/stages";
import styles from "./BlockDropTaskBar.module.css";

const UNIT: Record<BlockGoal["kind"], string> = { "clear-rows": "排", "clear-stones": "排", "multi-clear": "次" };
/** 挑戰模式剩這麼多塊時，塊數改粉紅提醒 */
const PIECES_WARN = 3;

export function BlockDropTaskBar({ round, g }: { round: BlockRound; g: GameState }) {
  const { stage, station, mode } = round;
  const initialStones = stage.stones.length;
  const piecesLeft = mode === "challenge" ? Math.max(0, stage.pieceCap - g.pieces) : null;
  return (
    <section className={styles.taskBar} aria-label="本站任務進度">
      <div className={styles.head}>
        <span className={styles.place}>
          <span className={styles.placeMini}>
            <MiniStoneBoard stones={stage.stones} rows={3} cell={3} />
          </span>
          第 {station.index + 1} 站
          <span className={styles.placeName}>・{station.name}</span>
        </span>
        {piecesLeft != null ? (
          <span
            className={styles.pieces}
            data-warn={piecesLeft <= PIECES_WARN ? "true" : undefined}
            aria-label={`還能放 ${piecesLeft} 塊`}
          >
            <IconPieces size={16} />
            <span aria-hidden>{piecesLeft}</span>
          </span>
        ) : null}
      </div>
      <ul className={styles.goals} data-count={stage.goals.length}>
        {stage.goals.map((goal, i) => {
          const s = blockGoalStatus(goal, g, initialStones);
          return (
            <li
              key={i}
              className={styles.goal}
              data-done={s.done ? "true" : undefined}
              aria-label={`${blockGoalTitle(goal)}，${s.done ? "完成" : `還差 ${s.remaining} ${UNIT[goal.kind]}`}`}
            >
              <span className={styles.goalIcon} aria-hidden>
                <BlockGoalIcon goal={goal} cell={9} />
              </span>
              {s.done ? (
                <span className={styles.goalCheck} aria-hidden>
                  <IconCheck size={22} />
                </span>
              ) : (
                <b className={styles.goalNum} aria-hidden>
                  {s.remaining}
                </b>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
