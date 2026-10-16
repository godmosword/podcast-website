"use client";

import { DirtOverlay, PieceArt, PieceGift } from "@/components/games/CandyMatchPieceArt";
import { IconBroom, IconRainbow } from "@/components/games/ClayIcons";
import { IconFootprints } from "@/components/games/CandyMatchIcons";
import Icon from "@/components/ui/Icon";
import type { CandyMatchRound } from "@/lib/games/candy-match/stages";
import {
  goalCompletion,
  goalLine,
  goalShortfallLabel,
  goalStatus,
  type CandyGoal,
  type CandyProgress,
} from "@/lib/games/candy-match/tasks";
import styles from "./CandyMatchPlay.module.css";

type CandyMatchTaskBarProps = {
  round: CandyMatchRound;
  progress: CandyProgress;
  movesLeft: number;
  /** 遊戲設定的「念出來」；關掉時再聽一次收起來。 */
  voiceEnabled: boolean;
  /** 朗讀關著時停用重播，由頂部音效或設定恢復。 */
  voiceMuted: boolean;
  reducedMotion: boolean;
  onReplay: () => void;
  /** 點目標卡，再念這一項。 */
  onHearGoal: (goal: CandyGoal) => void;
};

/** 目標圖示（任務列、關前介紹、地圖大卡共用）：孩子靠圖認任務。 */
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

const RING_R = 18;
const RING_C = 2 * Math.PI * RING_R;

function GoalProgressRing({ ratio, done }: { ratio: number; done: boolean }) {
  const clamped = done ? 1 : Math.max(0, Math.min(1, ratio));
  return (
    <svg className={styles.goalRing} viewBox="0 0 48 48" aria-hidden focusable="false">
      <circle className={styles.goalRingTrack} cx="24" cy="24" r={RING_R} />
      <circle
        className={done ? styles.goalRingDone : styles.goalRingValue}
        cx="24"
        cy="24"
        r={RING_R}
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C * (1 - clamped)}
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}

type CandyGoalCardProps = {
  goal: CandyGoal;
  progress: CandyProgress;
  /** 點了再念這一項。沒給就是結算上的靜態卡。 */
  onHear?: () => void;
  /** short：沒完成時改顯示「再差 N 台！」。 */
  emphasis?: "play" | "short";
};

/** 一張目標卡：車車圖、進度環、倒數或「完成！」印章。 */
export function CandyGoalCard({ goal, progress, onHear, emphasis = "play" }: CandyGoalCardProps) {
  const status = goalStatus(goal, progress);
  const label = goalLine(goal, progress);
  const ratio = status.need > 0 ? status.got / status.need : 0;
  const showShort = emphasis === "short" && !status.done;
  const body = (
    <>
      <span
        className={styles.goalRingWrap}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={status.need}
        aria-valuenow={status.got}
        aria-label={label}
      >
        <GoalProgressRing ratio={ratio} done={status.done} />
        <span className={styles.goalArt} aria-hidden>
          <CandyGoalIcon goal={goal} size={42} />
        </span>
      </span>
      {status.done ? (
        <span className={styles.goalStamp} data-testid="candy-goal-stamp">
          完成！
        </span>
      ) : showShort ? (
        <b className={styles.goalShort}>{goalShortfallLabel(goal, status.remaining)}</b>
      ) : (
        <b className={styles.goalCount}>{status.remaining}</b>
      )}
    </>
  );
  if (onHear) {
    return (
      <button
        type="button"
        className={styles.goalCardButton}
        data-done={status.done ? "true" : undefined}
        aria-label={label}
        onClick={onHear}
      >
        {body}
      </button>
    );
  }
  return (
    <div className={styles.goalCardButton} data-done={status.done ? "true" : undefined} data-static="true" aria-label={label}>
      {body}
    </div>
  );
}

/**
 * 局內第一眼：本關要做什麼。站點圖＋站名、逐項目標卡（圖案＋進度環＋剩下的數字，完成蓋章）、
 * 挑戰模式的步數（腳印）。目標名稱與「還差幾個」整句留給讀屏。
 * 第三顆星的交換次數不在局內倒數，結算時才用腳印那顆星說明。
 */
export function CandyMatchTaskBar({
  round,
  progress,
  movesLeft,
  voiceEnabled,
  voiceMuted,
  reducedMotion,
  onReplay,
  onHearGoal,
}: CandyMatchTaskBarProps) {
  const goals = round.stage.goals;
  const completion = goalCompletion(goals, progress);
  const nearComplete = completion >= 0.75 && completion < 1;
  return (
    <section
      className={styles.taskBar}
      aria-label="本關任務進度"
      data-near-complete={nearComplete ? "true" : undefined}
      data-reduced={reducedMotion ? "true" : undefined}
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
        {voiceEnabled ? (
          <span className={styles.voiceRow}>
            <button
              type="button"
              className={styles.replayButton}
              aria-label="再聽一次"
              data-muted={voiceMuted ? "true" : undefined}
              disabled={voiceMuted}
              onClick={onReplay}
            >
              <span aria-hidden>↻</span>
              <Icon name={voiceMuted ? "volume-off" : "volume-on"} size={20} />
              <span>再聽一次</span>
            </button>
          </span>
        ) : null}
      </div>
      <ul className={styles.goalList} data-count={goals.length}>
        {goals.map((goal, i) => (
          <li key={i} data-candy-goal={i}>
            <CandyGoalCard goal={goal} progress={progress} onHear={() => onHearGoal(goal)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
