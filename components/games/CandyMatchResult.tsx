"use client";

import type { ReactNode } from "react";
import { GameEndStation } from "@/components/games/GameEndStation";
import { IconBubble, IconStar } from "@/components/games/ClayIcons";
import { IconFootprints, IconMapFold } from "@/components/games/CandyMatchIcons";
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
function missedRules(round: CandyMatchRound, outcome: CandyWin) {
  const missed: { key: string; text: string; mark: ReactNode }[] = [];
  if (!outcome.flawless) missed.push({ key: "flawless", text: "不用道具", mark: <NoPropsMark /> });
  if (!outcome.efficient) {
    missed.push({
      key: "efficient",
      text: round.stage.moves > 0 ? `剩 ${round.stage.efficiency} 步以上` : `${round.stage.efficiency} 次交換內`,
      mark: <IconFootprints size={18} />,
    });
  }
  return missed;
}

/**
 * 結算星星：三顆一排、由左往右亮（孩子只看亮幾顆）。
 * 沒拿滿才在下面放小籤「條件圖＋兩三個字＋＋★」告訴大人還差什麼；拿滿就只有星星。
 */
function ResultStars({ round, outcome, animate }: { round: CandyMatchRound; outcome: CandyWin; animate: boolean }) {
  const stars = Math.max(1, Math.min(3, outcome.stars));
  const missed = missedRules(round, outcome);
  return (
    <div className={styles.resultStars}>
      <p className={styles.starRow} role="img" aria-label={`拿到 ${stars} 顆星，共 3 顆`} data-animate={animate ? "true" : undefined}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.resultStar} data-met={i < stars ? "true" : undefined} aria-hidden>
            <IconStar size={i === 1 ? 64 : 52} color={i < stars ? "#ffd34d" : "#e7e1ea"} />
          </span>
        ))}
      </p>
      {missed.length > 0 ? (
        <ul className={styles.starHints} aria-label="還能多拿星星">
          {missed.map((m) => (
            <li key={m.key} className={styles.starHint} data-rule={m.key}>
              <span className={styles.starHintMark} aria-hidden>
                {m.mark}
              </span>
              {m.text}
              <span className={styles.starHintPlus} aria-hidden>
                +<IconStar size={16} />
              </span>
              <span className="sr-only">過關，多拿一顆星</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
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
          details={<ResultStars round={round} outcome={outcome} animate={!reducedMotion} />}
          leadingAction={mapAction}
          hideHubLink
        />
      ) : (
        <GameEndStation
          mood="retry"
          title="步數用完了，再試一次！"
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
