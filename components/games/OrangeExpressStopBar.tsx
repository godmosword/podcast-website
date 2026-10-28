"use client";

import type { CSSProperties } from "react";
import { XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
import { COPY, GRADE_TEXT } from "@/lib/games/orange-express/copy";
import { currentStation } from "@/lib/games/orange-express/reducer";
import { stopBarFor } from "@/lib/games/orange-express/stop-target";
import type { RunState } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

function span(from: number, to: number): CSSProperties {
  return { left: `${from}%`, width: `${Math.max(0, to - from)}%` };
}

function distanceText(meters: number): string {
  if (meters < 0) return `過了 ${-meters} 公尺`;
  return `還有 ${meters} 公尺`;
}

/** 前窗上方的停車目標條：黃區、綠區、目標線、預測停車點、小橘現在的位置。 */
export function OrangeExpressStopBar({ run, numbers }: { run: RunState; numbers: boolean }) {
  const bar = stopBarFor(run);
  if (!bar) return null;
  const grade = run.grades[run.stationIndex];
  const atStation = run.phase === "stopped" || run.phase === "doors-open";
  let words: string = numbers ? distanceText(bar.remainingMeters) : bar.words;
  if (run.phase === "reversing") words = COPY.reversing;
  else if (atStation && grade) words = GRADE_TEXT[grade];

  return (
    <div
      className={styles.stopBar}
      role="group"
      aria-label={`${COPY.stopTarget}，${currentStation(run).name}`}
      data-testid="orange-express-stopbar"
      data-phase={run.phase}
      data-grade={atStation && grade ? grade : "none"}
      data-predicted={bar.predictedGrade ?? "none"}
    >
      <div className={styles.stopTrack} aria-hidden>
        <span className={styles.stopYellow} style={span(bar.yellow[0], bar.yellow[1])} />
        <span className={styles.stopGreen} style={span(bar.green[0], bar.green[1])} />
        <span className={styles.stopTargetLine} style={{ left: `${bar.target}%` }} />
        {bar.predicted !== null ? (
          <span
            className={styles.stopPredicted}
            data-grade={bar.predictedGrade ?? "none"}
            style={{ left: `${bar.predicted}%` }}
          />
        ) : null}
        <span className={styles.stopTrain} style={{ left: `${bar.train}%` }}>
          <XiaojuFace />
        </span>
      </div>
      <p className={styles.stopWords} data-testid="orange-express-stop-words">
        {words}
        {bar.predicted !== null && !atStation && run.phase !== "reversing" ? (
          <span className={styles.srOnly}>，{COPY.predicted}</span>
        ) : null}
      </p>
    </div>
  );
}
