"use client";

import { GameEndStation } from "@/components/games/GameEndStation";
import { IconStar } from "@/components/games/ClayIcons";
import type { CandyMatchRound } from "@/lib/games/candy-match/stages";
import type { CandyRoundOutcome } from "./useCandyMatchPlay";
import styles from "./CandyMatchPlay.module.css";

type CandyMatchResultProps = {
  round: CandyMatchRound;
  outcome: CandyRoundOutcome;
  /** 存檔中這關的累積獎章（0–3） */
  medalStars: number;
  isLastLevel: boolean;
  reducedMotion: boolean;
  onNext: () => void;
  onReplay: () => void;
  onMap: () => void;
};

const CONFETTI = ["var(--c-pink)", "var(--c-yellow)", "var(--c-mint)", "var(--c-sky)", "var(--c-lilac)"];

function efficiencyRule(round: CandyMatchRound): string {
  return round.stage.moves > 0
    ? `剩 ${round.stage.efficiency} 步以上完成`
    : `${round.stage.efficiency} 次交換內完成`;
}

function StarRules({ round, outcome, medalStars }: { round: CandyMatchRound; outcome: Extract<CandyRoundOutcome, { kind: "win" }>; medalStars: number }) {
  const rules = [
    { label: "完成任務", met: true },
    { label: "不用道具", met: outcome.flawless },
    { label: efficiencyRule(round), met: outcome.efficient },
  ];
  return (
    <div className={styles.starRules}>
      <ul aria-label="本局星星條件">
        {rules.map((rule) => (
          <li key={rule.label} data-met={rule.met ? "true" : undefined}>
            <span aria-hidden>{rule.met ? "✓" : "○"}</span>
            {rule.label}
            <span className={styles.visuallyHidden}>{rule.met ? "，達成" : "，未達成"}</span>
          </li>
        ))}
      </ul>
      <p className={styles.medalLine} aria-label={`這一站總共 ${medalStars} 顆獎章星`}>
        這一站總共
        <span aria-hidden className={styles.medalStars}>
          {[0, 1, 2].map((i) => (
            <IconStar key={i} size={14} color={i < medalStars ? "#ffd34d" : "#d9d0e0"} />
          ))}
        </span>
      </p>
    </div>
  );
}

/** 結算：本局星數與條件、累積獎章；主按鈕下一站，次按鈕再挑戰／回地圖。 */
export function CandyMatchResult({
  round,
  outcome,
  medalStars,
  isLastLevel,
  reducedMotion,
  onNext,
  onReplay,
  onMap,
}: CandyMatchResultProps) {
  const mapButton = (
    <button type="button" className={styles.mapButton} onClick={onMap}>
      回地圖
    </button>
  );
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
          stars={outcome.stars}
          scoreLabel="這一局"
          gameSlug="candy-match"
          onReplay={onReplay}
          replayLabel="再挑戰"
          mainAction={isLastLevel ? undefined : { label: "下一站", icon: "next", onClick: onNext }}
          details={<StarRules round={round} outcome={outcome} medalStars={medalStars} />}
          extraActions={mapButton}
          hideHubLink
        />
      ) : (
        <GameEndStation
          mood="retry"
          title="步數用完了，再試一次！"
          gameSlug="candy-match"
          onReplay={onReplay}
          replayLabel="再來一次"
          extraActions={mapButton}
          hideHubLink
        />
      )}
    </div>
  );
}
