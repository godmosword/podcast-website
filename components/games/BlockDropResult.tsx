"use client";

/**
 * 《繽紛樂園》任務冒險結算（對齊消消樂）：過關＝三顆星一排＋沒拿滿才出的條件小籤；
 * 挑戰重來、輕鬆收尾只留短標題。按鈕一排「回地圖｜主鈕｜次鈕」，主鈕在中線。不顯示分數，不用失敗用語。
 */
import { GameEndStation } from "@/components/games/GameEndStation";
import { IconMapFold } from "@/components/games/CandyMatchIcons";
import { IconPieces, IconUnderLine } from "@/components/games/BlockDropIcons";
import { ResultStars, type ResultStarHint } from "@/components/games/ResultStars";
import type { BlockRound } from "@/lib/games/block-drop/stages";
import type { BlockOutcome } from "./useBlockDropGame";
import { secondaryBtn } from "./blockDropTheme";

type Props = {
  round: BlockRound;
  outcome: BlockOutcome;
  isLast: boolean;
  font: string;
  reducedMotion: boolean;
  onNext: () => void;
  onReplay: () => void;
  onEasier: () => void;
  onMap: () => void;
};

/** 沒拿到的星各自差哪個條件；拿滿三顆時是空的。 */
function missedRules(round: BlockRound, outcome: Extract<BlockOutcome, { kind: "won" }>): ResultStarHint[] {
  const missed: ResultStarHint[] = [];
  if (!outcome.flawless) missed.push({ key: "flawless", text: "不越黃線", mark: <IconUnderLine size={20} /> });
  if (!outcome.efficient) {
    missed.push({ key: "efficient", text: `${round.stage.efficiency} 塊內`, mark: <IconPieces size={18} />, markColor: "#3159a8" });
  }
  return missed;
}

export function BlockDropResult({ round, outcome, isLast, font, reducedMotion, onNext, onReplay, onEasier, onMap }: Props) {
  const mapAction = { label: "回地圖", icon: <IconMapFold size={22} />, onClick: onMap };
  if (outcome.kind === "won") {
    return (
      <GameEndStation
        mood="win"
        title={isLast ? "全部完成！" : "過關了！"}
        gameSlug="block-drop"
        onReplay={onReplay}
        replayLabel="再挑戰"
        mainAction={isLast ? undefined : { label: "下一站", icon: "next", onClick: onNext }}
        details={<ResultStars stars={outcome.stars} hints={missedRules(round, outcome)} animate={!reducedMotion} />}
        leadingAction={mapAction}
        hideHubLink
      />
    );
  }
  if (outcome.kind === "wrapUp") {
    return (
      <GameEndStation
        mood="over"
        title={outcome.lines > 0 ? `已經消了 ${outcome.lines} 排！` : "休息一下！"}
        gameSlug="block-drop"
        onReplay={onReplay}
        replayLabel="再試一次"
        leadingAction={mapAction}
        extraActions={
          round.station.index > 0 ? (
            <button type="button" onClick={onEasier} style={{ ...secondaryBtn(font), marginTop: 8 }}>
              換簡單的
            </button>
          ) : null
        }
        hideHubLink
      />
    );
  }
  return (
    <GameEndStation
      mood="retry"
      title={outcome.reason === "outOfPieces" ? "方塊用完了！" : "方塊到頂了！"}
      gameSlug="block-drop"
      onReplay={onReplay}
      replayLabel="再挑戰"
      leadingAction={mapAction}
      hideHubLink
    />
  );
}
