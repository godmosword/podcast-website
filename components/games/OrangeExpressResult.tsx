"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ResultStars } from "@/components/games/ResultStars";
import { IconTrain } from "@/components/games/ClayIcons";
import { DoorIcon, StopIcon } from "@/components/games/OrangeExpressCab";
import { LandmarkGlyph, XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
import { XIAOJU_STICKER_SRC } from "@/lib/games/orange-express/art";
import { COPY, GRADE_WORD, bridgeResultText, landmarkResultText, pointsResultText } from "@/lib/games/orange-express/copy";
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
  resultLine,
  smoothStops,
  missReason,
  reduced,
  stations,
  grades,
  pointsDone,
  bridgeGreets,
  landmarkGreets,
  landmarkTask,
  onReplay,
  onTitle,
}: {
  stars: number;
  resultLine: string;
  smoothStops: number;
  missReason: StarMissReason | null;
  reduced: boolean;
  stations: readonly Station[];
  grades: readonly StopGrade[];
  pointsDone: number;
  bridgeGreets: number;
  /** 停好後跟地標打過招呼的站（站號）。 */
  landmarkGreets: readonly number[];
  /** 這一組有沒有跟地標打招呼的任務（大司機、小站長）；沒有就不蓋章，地標照常上色。 */
  landmarkTask: boolean;
  onReplay: () => void;
  onTitle: () => void;
}) {
  const next = getNextGame("orange-express");
  const statParts = [
    pointsDone > 0 ? `指差 ${pointsDone}` : null,
    bridgeGreets > 0 ? `鐵橋 ${bridgeGreets}` : null,
    landmarkGreets.length > 0 ? `地標 ${landmarkGreets.length}` : null,
    smoothStops > 0 ? `輕停 ${smoothStops}` : null,
  ].filter((part): part is string => part !== null);
  const statLabel = [
    pointsDone > 0 ? pointsResultText(pointsDone) : null,
    bridgeGreets > 0 ? bridgeResultText(bridgeGreets) : null,
    landmarkGreets.length > 0 ? landmarkResultText(landmarkGreets.length) : null,
    smoothStops > 0 ? `平穩停車 ${smoothStops} 站` : null,
  ].filter((part): part is string => part !== null).join("、");
  return (
    <div className={styles.result} data-testid="orange-express-result" data-reduced={reduced ? "true" : "false"}>
      {/* 到家的小橘（B10）：貼紙生好前用向量小橘臉。 */}
      <span className={styles.resultXiaoju} data-testid="orange-express-result-xiaoju" aria-hidden>
        {XIAOJU_STICKER_SRC ? (
          <Image src={XIAOJU_STICKER_SRC} alt="" width={112} height={112} />
        ) : (
          <XiaojuFace />
        )}
      </span>
      <h2>{COPY.arrivedHome}</h2>
      <p className={styles.resultLine} data-testid="orange-express-result-line">{resultLine}</p>
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
              <LandmarkGlyph
                id={station.landmark}
                className={styles.resultLandmark}
                stamped={landmarkTask ? landmarkGreets.includes(index) : undefined}
              />
              <span className={styles.stationGradeName}>{station.name}</span>
              <span className={styles.gradeWord}>{GRADE_WORD[grade]}</span>
            </li>
          );
        })}
      </ol>
      {statParts.length > 0 ? (
        <ul className={styles.extras} data-testid="orange-express-extras" aria-label={statLabel}>
          <li>{statParts.join("・")}</li>
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
