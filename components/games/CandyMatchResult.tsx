"use client";

import { GameEndStation } from "@/components/games/GameEndStation";
import { IconBubble, IconSwap } from "@/components/games/ClayIcons";
import { IconFootprints, IconMapFold } from "@/components/games/CandyMatchIcons";
import { ResultStars, type ResultStarHint } from "@/components/games/ResultStars";
import type { CandyMatchRound } from "@/lib/games/candy-match/stages";
import type { CandyRoundOutcome } from "./useCandyMatchPlay";
import styles from "./CandyMatchPlay.module.css";

type CandyMatchResultProps = {
  round: CandyMatchRound;
  outcome: CandyRoundOutcome;
  isLastLevel: boolean;
  reducedMotion: boolean;
  onNext: () => void;
  onReplay: () => void;
  onMap: () => void;
};

const CONFETTI = ["var(--c-pink)", "var(--c-yellow)", "var(--c-mint)", "var(--c-sky)", "var(--c-lilac)"];

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

/** 結算：標題＋三顆星（沒拿滿才多一行提示）；按鈕一排「回地圖｜下一站｜再挑戰」，主鈕在中線。 */
export function CandyMatchResult({
  round,
  outcome,
  isLastLevel,
  reducedMotion,
  onNext,
  onReplay,
  onMap,
}: CandyMatchResultProps) {
  const mapAction = { label: "回地圖", icon: <IconMapFold size={22} />, onClick: onMap };
  return (
    <div className={styles.resultOverlay} data-testid="candy-match-result">
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
          title={isLastLevel ? "全部完成！" : "任務完成！"}
          gameSlug="candy-match"
          onReplay={onReplay}
          replayLabel="再挑戰"
          mainAction={isLastLevel ? undefined : { label: "下一站", icon: "next", onClick: onNext }}
          details={<ResultStars stars={outcome.stars} hints={missedRules(round, outcome)} animate={!reducedMotion} />}
          leadingAction={mapAction}
          hideHubLink
        />
      ) : (
        <GameEndStation
          mood="retry"
          title="步數用完了！"
          gameSlug="candy-match"
          onReplay={onReplay}
          replayLabel="再來一次"
          leadingAction={mapAction}
          hideHubLink
        />
      )}
    </div>
  );
}
