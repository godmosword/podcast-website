"use client";

import Link from "next/link";
import { ResultStars } from "@/components/games/ResultStars";
import { IconTrain } from "@/components/games/ClayIcons";
import { COPY, GRADE_TEXT } from "@/lib/games/orange-express/copy";
import type { Station, StopGrade } from "@/lib/games/orange-express/types";
import { getNextGame } from "@/data/games";
import styles from "./orange-express.module.css";

export function OrangeExpressResult({
  stars,
  flawless,
  reduced,
  stations,
  grades,
  onReplay,
  onTitle,
}: {
  stars: number;
  flawless: boolean;
  reduced: boolean;
  stations: readonly Station[];
  grades: readonly StopGrade[];
  onReplay: () => void;
  onTitle: () => void;
}) {
  const next = getNextGame("orange-express");
  return (
    <div className={styles.result} data-testid="orange-express-result">
      <h2>{COPY.arrivedHome}</h2>
      <ResultStars
        stars={stars}
        animate={!reduced}
        hints={
          flawless
            ? []
            : [{ key: "stop", text: COPY.starHint, mark: <IconTrain size={18} /> }]
        }
      />
      <ol className={styles.stationGrades}>
        {stations.map((station, index) => {
          const grade = grades[index] ?? "yellow";
          return (
            <li key={station.id} data-grade={grade}>
              <span className={styles.stationGradeName}>{station.name}</span>
              <span className={styles.gradeStars} data-grade={grade} aria-hidden>
                {grade === "green" ? "★★★" : "★★"}
              </span>
              <span className={styles.srOnly}>{GRADE_TEXT[grade]}</span>
            </li>
          );
        })}
      </ol>
      <div className={styles.resultActions}>
        <button type="button" className={styles.primary} onClick={onReplay}>
          {COPY.again}
        </button>
        <button type="button" className={styles.secondary} onClick={onTitle}>
          {COPY.backTitle}
        </button>
      </div>
      {next ? (
        <Link href={next.href} className={styles.nextLink}>
          {COPY.nextGame}
          {next.title}
        </Link>
      ) : null}
    </div>
  );
}
