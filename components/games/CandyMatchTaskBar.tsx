"use client";

import { DirtOverlay, PieceArt, PieceGift } from "@/components/games/CandyMatchPieceArt";
import { IconBroom, IconRainbow, IconStar } from "@/components/games/ClayIcons";
import type { CandyMatchRound } from "@/lib/games/candy-match/stages";
import {
  goalCompletion,
  goalStatus,
  goalTitle,
  type CandyGoal,
  type CandyProgress,
} from "@/lib/games/candy-match/tasks";
import styles from "./CandyMatchPlay.module.css";

type CandyMatchTaskBarProps = {
  round: CandyMatchRound;
  progress: CandyProgress;
  movesLeft: number;
};

const UNIT: Record<CandyGoal["kind"], string> = {
  "collect-any": "個",
  collect: "個",
  "clean-dirt": "格",
  "drop-item": "個",
  detonate: "次",
};

/** 目標圖示（任務列與地圖大卡共用）：孩子靠圖認任務，數字與短句輔助。 */
export function CandyGoalIcon({ goal, size = 32 }: { goal: CandyGoal; size?: number }) {
  switch (goal.kind) {
    case "collect":
      return <PieceArt piece={goal.piece} size={size} />;
    case "clean-dirt":
      return <DirtOverlay size={size - 2} />;
    case "drop-item":
      return <PieceGift size={size - 2} />;
    case "detonate":
      return (
        <span className={styles.iconPair}>
          <IconBroom size={Math.round(size * 0.56)} />
          <IconRainbow size={Math.round(size * 0.56)} />
        </span>
      );
    case "collect-any":
      return (
        <span className={styles.iconStack}>
          {[0, 1, 2].map((piece) => (
            <PieceArt key={piece} piece={piece} size={Math.round(size * 0.5)} />
          ))}
        </span>
      );
  }
}

/** 輕鬆模式：局內就看得到第三顆星還剩幾次交換（中性色，不用警告色）。 */
function EfficiencyChip({ round, progress }: { round: CandyMatchRound; progress: CandyProgress }) {
  const remaining = round.stage.efficiency - progress.swaps;
  const label =
    remaining > 0
      ? `第三顆星：再 ${remaining} 次交換內完成`
      : "第三顆星：這局交換次數已用完，慢慢完成就好";
  return (
    <span className={styles.starChip} data-spent={remaining > 0 ? undefined : "true"} aria-label={label}>
      <IconStar size={14} color={remaining > 0 ? "#ffd34d" : "#d9d0e0"} />
      <span aria-hidden>{remaining > 0 ? `再 ${remaining} 次` : "慢慢來"}</span>
    </span>
  );
}

/** 局內第一眼：本關要做什麼。關號＋地名、逐項目標（完成打勾）、步數或第三顆星、整體進度。 */
export function CandyMatchTaskBar({ round, progress, movesLeft }: CandyMatchTaskBarProps) {
  const goals = round.stage.goals;
  const completion = goalCompletion(goals, progress);
  const nearComplete = completion >= 0.75 && completion < 1;
  return (
    <section
      className={styles.taskBar}
      aria-label="本關任務進度"
      data-near-complete={nearComplete ? "true" : undefined}
    >
      <div className={styles.taskHead}>
        <span className={styles.taskPlace}>
          第 {round.index + 1} 站
          <span className={styles.taskPlaceName}>・{round.place}</span>
        </span>
        {round.stage.moves > 0 ? (
          <span
            className={movesLeft <= 5 ? styles.movesWarning : styles.movesLabel}
            aria-label={`還有 ${movesLeft} 步`}
          >
            剩 {movesLeft} 步
          </span>
        ) : (
          <EfficiencyChip round={round} progress={progress} />
        )}
      </div>
      <ul className={styles.goalList} data-count={goals.length}>
        {goals.map((goal, i) => {
          const status = goalStatus(goal, progress);
          return (
            <li
              key={i}
              className={styles.goal}
              data-done={status.done ? "true" : undefined}
              aria-label={`${goalTitle(goal)}，${status.done ? "完成" : `還差 ${status.remaining} ${UNIT[goal.kind]}`}`}
            >
              <span className={styles.goalIcon} aria-hidden>
                <CandyGoalIcon goal={goal} />
              </span>
              <span className={styles.goalText} aria-hidden>
                <span className={styles.goalTitle}>{goalTitle(goal)}</span>
                {status.done ? (
                  <span className={styles.goalRemain}>完成</span>
                ) : (
                  <span className={styles.goalRemain}>
                    還差 <b className={styles.goalNum}>{status.remaining}</b> {UNIT[goal.kind]}
                  </span>
                )}
              </span>
              {status.done ? (
                <span className={styles.goalCheck} aria-hidden>
                  ✓
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(completion * 100)}
        aria-label="任務完成度"
      >
        <span className={styles.progressFill} style={{ width: `${Math.max(5, completion * 100)}%` }} />
      </div>
    </section>
  );
}
