"use client";

import { GameEndStation } from "@/components/games/GameEndStation";
import { IconBubble, IconSwap } from "@/components/games/ClayIcons";
import { IconFootprints, IconMapFold } from "@/components/games/CandyMatchIcons";
import { CandyGoalCard } from "@/components/games/CandyMatchTaskBar";
import { ResultStars, type ResultStarHint } from "@/components/games/ResultStars";
import type { CandyMatchRound } from "@/lib/games/candy-match/stages";
import { goalStatus, type CandyGoal, type CandyProgress } from "@/lib/games/candy-match/tasks";
import type { CandyRoundOutcome } from "./useCandyMatchPlay";
import styles from "./CandyMatchPlay.module.css";

type CandyMatchResultProps = {
  round: CandyMatchRound;
  progress: CandyProgress;
  outcome: CandyRoundOutcome;
  isLastLevel: boolean;
  reducedMotion: boolean;
  onNext: () => void;
  onReplay: () => void;
  onMap: () => void;
};

const CONFETTI = [
  "var(--c-pink)",
  "var(--c-yellow)",
  "var(--c-mint)",
  "var(--c-sky)",
  "var(--c-lilac)",
  "#4da3ff",
  "#ff8a3d",
  "#3d5a98",
];

type CandyWin = Extract<CandyRoundOutcome, { kind: "win" }>;

/** 「沒用道具」：泡泡加一道斜線。 */
function NoPropsMark() {
  return (
    <span className={styles.noProps}>
      <IconBubble size={18} />
      <svg viewBox="0 0 24 24" aria-hidden focusable="false" className={styles.noPropsSlash}>
        <path d="M5 19L19 5" />
      </svg>
    </span>
  );
}

/** 沒拿到的星各自差哪個條件；拿滿三顆時是空的。 */
function missedRules(round: CandyMatchRound, outcome: CandyWin): ResultStarHint[] {
  const missed: ResultStarHint[] = [];
  if (!outcome.flawless) missed.push({ key: "flawless", text: "不用道具", mark: <NoPropsMark /> });
  if (!outcome.efficient) {
    missed.push({
      key: "efficient",
      markColor: "#3159a8",
      // 挑戰＝步數（腳印，和地圖、任務列同一個圖）；輕鬆＝交換次數（換位圖）
      ...(round.stage.moves > 0
        ? { text: `剩 ${round.stage.efficiency} 步以上`, mark: <IconFootprints size={18} /> }
        : { text: `${round.stage.efficiency} 次交換內`, mark: <IconSwap size={20} /> }),
    });
  }
  return missed;
}

function GoalRecap({
  goals,
  progress,
  emphasis,
}: {
  goals: readonly CandyGoal[];
  progress: CandyProgress;
  emphasis: "play" | "short";
}) {
  const items = goals.filter((goal) => emphasis !== "short" || !goalStatus(goal, progress).done);
  if (items.length === 0) return null;
  return (
    <ul className={styles.goalList} data-count={items.length} aria-label={emphasis === "short" ? "還差這些" : "本關目標"}>
      {items.map((goal, i) => (
        <li key={i}>
          <CandyGoalCard goal={goal} progress={progress} emphasis={emphasis} />
        </li>
      ))}
    </ul>
  );
}

/** 結算：過關蓋章，或挑戰沒過時標出還差幾台。按鈕一排「回地圖｜下一站｜再挑戰」，主鈕在中線。 */
export function CandyMatchResult({
  round,
  progress,
  outcome,
  isLastLevel,
  reducedMotion,
  onNext,
  onReplay,
  onMap,
}: CandyMatchResultProps) {
  const mapAction = { label: "回地圖", icon: <IconMapFold size={22} />, onClick: onMap };
  const goals = round.stage.goals;
  return (
    <div
      className={styles.resultOverlay}
      data-testid="candy-match-result"
      data-reduced={reducedMotion ? "true" : undefined}
    >
      {outcome.kind === "win" && !reducedMotion ? (
        <div className={styles.confetti} aria-hidden>
          {CONFETTI.flatMap((color, i) =>
            [0, 1].map((copy) => (
              <span
                key={`${i}-${copy}`}
                className={styles.confettiPiece}
                style={{
                  ["--x" as string]: `${12 + i * 18 + copy * 8}%`,
                  ["--c" as string]: color,
                  ["--delay" as string]: `${(i + copy) * 70}ms`,
                }}
              />
            )),
          )}
        </div>
      ) : null}
      {outcome.kind === "win" ? (
        <GameEndStation
          mood="win"
          title="過關！"
          gameSlug="candy-match"
          onReplay={onReplay}
          replayLabel="再挑戰"
          mainAction={isLastLevel ? undefined : { label: "下一站", icon: "next", onClick: onNext }}
          details={
            <>
              {isLastLevel ? <p className={styles.introLine}>全部完成！</p> : null}
              <GoalRecap goals={goals} progress={progress} emphasis="play" />
              <ResultStars stars={outcome.stars} hints={missedRules(round, outcome)} animate={!reducedMotion} />
            </>
          }
          leadingAction={mapAction}
          hideHubLink
          sideSize={56}
        />
      ) : (
        <GameEndStation
          mood="retry"
          title="再試一次！"
          gameSlug="candy-match"
          onReplay={onReplay}
          replayLabel="再來一次"
          details={<GoalRecap goals={goals} progress={progress} emphasis="short" />}
          leadingAction={mapAction}
          hideHubLink
          sideSize={56}
        />
      )}
    </div>
  );
}
