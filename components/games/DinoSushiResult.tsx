"use client";

import { GameEndStation } from "@/components/games/GameEndStation";
import { IconChevronLeft } from "@/components/games/ClayIcons";
import { ResultStars, type ResultStarHint } from "@/components/games/ResultStars";
import { PlateArt } from "@/lib/games/dino-sushi/art";
import type { RoundMedals } from "@/lib/games/dino-sushi/medals";
import type { DinoSushiOutcome } from "./DinoSushiView";
import styles from "./DinoSushiView.module.css";

type Props = {
  outcome: DinoSushiOutcome;
  /** 點餐模式拿到幾顆星；自由做為 null。 */
  stars: number | null;
  reducedMotion: boolean;
  onReplay: () => void;
  onTitle: () => void;
};

function GoldPlate() {
  return (
    <span className={styles.hintPlate}>
      <PlateArt gold />
    </span>
  );
}

/** 沒拿到的星各自差什麼（拿滿就空）。 */
function missedRules(medals: RoundMedals): ResultStarHint[] {
  const missed: ResultStarHint[] = [];
  if (!medals.flawless) missed.push({ key: "flawless", text: "3 盤一次做對", mark: <GoldPlate /> });
  if (!medals.collectedAll) missed.push({ key: "all", text: "5 盤都一次做對", mark: <GoldPlate /> });
  return missed;
}

/** 疊好的盤子：做了幾個一眼看得出來。 */
function PlateRow({ outcome }: { outcome: DinoSushiOutcome }) {
  return (
    <p className={styles.resultPlates} role="img" aria-label={`吃了 ${outcome.plates.length} 盤`}>
      {outcome.plates.slice(-10).map((p, i) => (
        <span key={i} className={styles.resultPlate} data-gold={p.gold ? "true" : undefined} aria-hidden>
          <PlateArt gold={p.gold} />
        </span>
      ))}
    </p>
  );
}

export function DinoSushiResult({ outcome, stars, reducedMotion, onReplay, onTitle }: Props) {
  const titleAction = { label: "回標題", icon: <IconChevronLeft size={22} />, onClick: onTitle };
  const details =
    outcome.medals && stars !== null ? (
      <>
        <PlateRow outcome={outcome} />
        <ResultStars stars={stars} hints={missedRules(outcome.medals)} animate={!reducedMotion} />
      </>
    ) : (
      <PlateRow outcome={outcome} />
    );
  return (
    <div className={styles.resultOverlay} data-testid="dino-sushi-result">
      <GameEndStation
        mood="win"
        title={outcome.mode === "order" ? "多多吃飽飽！" : "多多吃飽了！"}
        gameSlug="dino-sushi"
        onReplay={onReplay}
        replayLabel={outcome.mode === "order" ? "再做一輪" : "再自由做"}
        details={details}
        leadingAction={titleAction}
      />
    </div>
  );
}
