"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ResultStars } from "@/components/games/ResultStars";
import { IconTrain } from "@/components/games/ClayIcons";
import { DoorIcon, StopIcon } from "@/components/games/OrangeExpressCab";
import { LandmarkGlyph, XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
import { XIAOJU_STICKER_SRC } from "@/lib/games/orange-express/art";
import { COPY, GRADE_WORD, bridgeResultText, pointsResultText } from "@/lib/games/orange-express/copy";
import type { StarMissReason } from "@/lib/games/orange-express/medals";
import type { Station, StopGrade } from "@/lib/games/orange-express/types";
import { getNextGame } from "@/data/games";
import styles from "./orange-express.module.css";

/**
 * 少的那顆星卡在哪：只放一張小籤，說真正的原因。
 * 圖示用駕駛台上同一個符號：開過頭配停車燈（不用往前的箭頭，孩子會讀成「繼續開」），門配車門。
 */
const MISS_HINT: Record<StarMissReason, { text: string; mark: ReactNode }> = {
  green: { text: COPY.starHint, mark: <IconTrain size={18} /> },
  overrun: { text: COPY.overrunHint, mark: <StopIcon size={18} /> },
  "early-door": { text: COPY.earlyDoorHint, mark: <DoorIcon size={18} /> },
};

export function OrangeExpressResult({
  stars,
  missReason,
  reduced,
  stations,
  grades,
  pointsDone,
  bridgeGreets,
  onReplay,
  onTitle,
}: {
  stars: number;
  missReason: StarMissReason | null;
  reduced: boolean;
  stations: readonly Station[];
  grades: readonly StopGrade[];
  pointsDone: number;
  bridgeGreets: number;
  onReplay: () => void;
  onTitle: () => void;
}) {
  const next = getNextGame("orange-express");
  return (
    <div className={styles.result} data-testid="orange-express-result">
      {/* 到家的小橘（B10）：貼紙生好前用向量小橘臉。 */}
      <span className={styles.resultXiaoju} data-testid="orange-express-result-xiaoju" aria-hidden>
        {XIAOJU_STICKER_SRC ? (
          <Image src={XIAOJU_STICKER_SRC} alt="" width={112} height={112} />
        ) : (
          <XiaojuFace />
        )}
      </span>
      <h2>{COPY.arrivedHome}</h2>
      <ResultStars
        stars={stars}
        animate={!reduced}
        hints={missReason ? [{ key: missReason, ...MISS_HINT[missReason] }] : []}
      />
      <ol className={styles.stationGrades}>
        {stations.map((station, index) => {
          const grade = grades[index] ?? "yellow";
          return (
            <li key={station.id} data-grade={grade}>
              <span className={styles.gradeSwatch} data-grade={grade} aria-hidden />
              <LandmarkGlyph id={station.landmark} className={styles.resultLandmark} />
              <span className={styles.stationGradeName}>{station.name}</span>
              <span className={styles.gradeWord}>{GRADE_WORD[grade]}</span>
            </li>
          );
        })}
      </ol>
      {pointsDone > 0 || bridgeGreets > 0 ? (
        <ul className={styles.extras} data-testid="orange-express-extras">
          {pointsDone > 0 ? <li>{pointsResultText(pointsDone)}</li> : null}
          {bridgeGreets > 0 ? <li>{bridgeResultText(bridgeGreets)}</li> : null}
        </ul>
      ) : null}
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
