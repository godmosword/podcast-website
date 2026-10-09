"use client";

import { DirtOverlay, PieceArt, PieceGift } from "@/components/games/CandyMatchPieceArt";
import { IconBroom, IconRainbow } from "@/components/games/ClayIcons";
import { IconCheck, IconFootprints } from "@/components/games/CandyMatchIcons";
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

/**
 * 局內第一眼：本關要做什麼。站點圖＋站名、逐項目標（圖案＋剩下的數字，完成打勾）、
 * 挑戰模式的步數（腳印）、整體進度。目標名稱與「還差幾個」整句留給讀屏。
 * 第三顆星的交換次數不在局內倒數，結算時才用腳印那顆星說明。
 */
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
          {/* eslint-disable-next-line @next/next/no-img-element -- 固定 256px 黏土小圖 */}
          <img
            src={`/games/v2/candy-match/places/${round.placeIcon}.webp`}
            alt=""
            width={256}
            height={256}
            className={styles.taskPlaceIcon}
          />
          第 {round.index + 1} 站
          <span className={styles.taskPlaceName}>・{round.place}</span>
        </span>
        {round.stage.moves > 0 ? (
          <span
            className={movesLeft <= 5 ? styles.movesWarning : styles.movesLabel}
            aria-label={`還有 ${movesLeft} 步`}
          >
            <IconFootprints size={16} />
            {movesLeft}
          </span>
        ) : null}
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
                <CandyGoalIcon goal={goal} size={36} />
              </span>
              {status.done ? (
                <span className={styles.goalCheck} aria-hidden>
                  <IconCheck size={22} />
                </span>
              ) : (
                <b className={styles.goalNum} aria-hidden>
                  {status.remaining}
                </b>
              )}
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
