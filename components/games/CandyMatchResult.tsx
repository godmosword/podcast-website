"use client";

import type { ReactNode } from "react";
import { GameEndStation } from "@/components/games/GameEndStation";
import { IconBubble, IconStar } from "@/components/games/ClayIcons";
import { IconFlag, IconFootprints, IconMapFold } from "@/components/games/CandyMatchIcons";
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

function efficiencyRule(round: CandyMatchRound): string {
  return round.stage.moves > 0
    ? `剩 ${round.stage.efficiency} 步以上完成`
    : `${round.stage.efficiency} 次交換內完成`;
}

/** 「沒用道具」：泡泡加一道斜線。 */
function NoPropsMark() {
  return (
    <span className={styles.noProps}>
      <IconBubble size={26} />
      <svg viewBox="0 0 24 24" aria-hidden focusable="false" className={styles.noPropsSlash}>
        <path d="M5 19L19 5" />
      </svg>
    </span>
  );
}

type StarRule = { key: string; caption: string; rule: string; met: boolean; mark: ReactNode; tone: string };

/**
 * 三顆星各對一個條件，條件畫成圖（旗子＝完成任務、泡泡劃線＝沒用道具、腳印＝步數內），
 * 下面兩三個字給大人；完整條件與達成與否給讀屏。
 */
function StarRules({ round, outcome }: { round: CandyMatchRound; outcome: Extract<CandyRoundOutcome, { kind: "win" }> }) {
  const rules: StarRule[] = [
    { key: "done", caption: "完成任務", rule: "完成任務", met: true, mark: <IconFlag size={24} />, tone: "flag" },
    { key: "flawless", caption: "沒用道具", rule: "不用道具", met: outcome.flawless, mark: <NoPropsMark />, tone: "props" },
    {
      key: "efficient",
      caption: round.stage.moves > 0 ? "省步數" : "換得快",
      rule: efficiencyRule(round),
      met: outcome.efficient,
      mark: <IconFootprints size={24} />,
      tone: "moves",
    },
  ];
  return (
    <ul className={styles.starRules} aria-label="本局星星條件">
      {rules.map((r) => (
        <li key={r.key} data-met={r.met ? "true" : undefined} data-tone={r.tone}>
          <span className={styles.ruleStar} aria-hidden>
            <IconStar size={48} color={r.met ? "#ffd34d" : "#e2d9e8"} />
          </span>
          <span className={styles.ruleMark} aria-hidden>
            {r.mark}
          </span>
          <span className={styles.ruleCaption} aria-hidden>
            {r.caption}
          </span>
          <span className={styles.visuallyHidden}>
            {r.rule}
            {r.met ? "，達成" : "，未達成"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** 結算：三顆星與各自的條件圖；主按鈕下一站，次按鈕再挑戰，地圖是圖示鈕。 */
export function CandyMatchResult({
  round,
  outcome,
  isLastLevel,
  reducedMotion,
  onNext,
  onReplay,
  onMap,
}: CandyMatchResultProps) {
  const mapButton = (
    <button type="button" className={styles.mapButton} onClick={onMap} aria-label="回地圖" title="回地圖">
      <IconMapFold size={24} />
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
          gameSlug="candy-match"
          onReplay={onReplay}
          replayLabel="再挑戰"
          mainAction={isLastLevel ? undefined : { label: "下一站", icon: "next", onClick: onNext }}
          details={<StarRules round={round} outcome={outcome} />}
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
