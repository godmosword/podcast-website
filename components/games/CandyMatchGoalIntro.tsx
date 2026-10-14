"use client";

import { useEffect, useRef } from "react";
import { CandyGoalIcon } from "@/components/games/CandyMatchTaskBar";
import type { CandyMatchRound } from "@/lib/games/candy-match/stages";
import { goalIntroLine } from "@/lib/games/candy-match/tasks";
import styles from "./CandyMatchPlay.module.css";

type CandyMatchGoalIntroProps = {
  round: CandyMatchRound;
  /** 這一盤有厚污漬時，多念、多顯示一句。 */
  thick: boolean;
  reducedMotion: boolean;
  onStart: () => void;
};

/**
 * 進關先看大圖和數量，聽到目標，再按「開始！」。
 * 點卡片或背景都會收起；朗讀跟抬頭音效同一個開關，由開局那句負責。
 */
export function CandyMatchGoalIntro({ round, thick, reducedMotion, onStart }: CandyMatchGoalIntroProps) {
  const startRef = useRef<HTMLButtonElement>(null);
  const goals = round.stage.goals;
  useEffect(() => {
    startRef.current?.focus();
  }, []);

  return (
    <div
      className={styles.introOverlay}
      data-testid="candy-match-intro"
      data-reduced={reducedMotion ? "true" : undefined}
    >
      <button
        ref={startRef}
        type="button"
        className={styles.introDismiss}
        aria-label="開始！"
        onClick={onStart}
      >
        <span className={styles.introCard} role="dialog" aria-label="本關任務">
          <span className={styles.introBadge}>本關任務</span>
          <ul className={styles.introGoals} data-count={goals.length}>
            {goals.map((goal, i) => (
              <li key={i} className={styles.introGoal}>
                <span className={styles.introPictures}>
                  <span className={styles.introArt} aria-hidden>
                    <CandyGoalIcon goal={goal} size={goals.length > 2 ? 72 : 112} />
                  </span>
                  <span className={styles.introTimes} aria-hidden>
                    ×
                  </span>
                  <span className={styles.introCount} aria-hidden>
                    {goal.count}
                  </span>
                </span>
                <span className={styles.introLine}>{goalIntroLine(goal)}</span>
              </li>
            ))}
          </ul>
          {thick ? <span className={styles.introThick}>有的污漬比較厚，要再掃一次！</span> : null}
          <span className={styles.introStart}>開始！</span>
        </span>
      </button>
    </div>
  );
}
