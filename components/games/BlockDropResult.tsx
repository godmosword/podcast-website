"use client";

/**
 * 《繽紛樂園》任務冒險結算：過關（本局星數＋條件＋這一站總共）、挑戰重來、輕鬆收尾卡。
 * 對齊消消樂結算；不顯示分數，不用失敗用語。
 */
import { GameEndStation } from "@/components/games/GameEndStation";
import { IconStar } from "@/components/games/ClayIcons";
import type { BlockRound } from "@/lib/games/block-drop/stages";
import type { BlockOutcome } from "./useBlockDropGame";
import { MACARON_THEME, secondaryBtn } from "./blockDropTheme";

type Props = {
  round: BlockRound;
  outcome: BlockOutcome;
  medalStars: number;
  isLast: boolean;
  font: string;
  onNext: () => void;
  onReplay: () => void;
  onEasier: () => void;
  onMap: () => void;
};

function StarRules({ round, outcome, medalStars }: { round: BlockRound; outcome: Extract<BlockOutcome, { kind: "won" }>; medalStars: number }) {
  const rules = [
    { label: "完成任務", met: true },
    { label: "方塊沒越過黃線", met: outcome.flawless },
    { label: `${round.stage.efficiency} 塊內完成`, met: outcome.efficient },
  ];
  return (
    <div style={{ display: "grid", gap: 6, margin: "0 auto 8px", color: MACARON_THEME.ink }}>
      <ul aria-label="本局星星條件" style={{ display: "grid", gap: 3, margin: 0, padding: 0, listStyle: "none" }}>
        {rules.map((rule) => (
          <li key={rule.label} style={{ display: "flex", justifyContent: "center", gap: 6, fontSize: 14, fontWeight: 800, color: rule.met ? MACARON_THEME.ink : MACARON_THEME.inkSoft }}>
            <span aria-hidden style={{ color: rule.met ? "#3f8a5a" : "#b9a9c6" }}>{rule.met ? "✓" : "○"}</span>
            {rule.label}
            <span className="sr-only">{rule.met ? "，達成" : "，未達成"}</span>
          </li>
        ))}
      </ul>
      <p
        aria-label={`這一站總共 ${medalStars} 顆獎章星`}
        style={{ justifySelf: "center", display: "inline-flex", alignItems: "center", gap: 6, margin: 0, padding: "4px 12px", borderRadius: 999, background: "rgba(216,199,255,.32)", fontSize: 13, fontWeight: 800 }}
      >
        這一站總共
        <span aria-hidden style={{ display: "inline-flex", gap: 1, lineHeight: 0 }}>
          {[0, 1, 2].map((i) => (
            <IconStar key={i} size={14} color={i < medalStars ? "#ffd34d" : "#d9d0e0"} />
          ))}
        </span>
      </p>
    </div>
  );
}

export function BlockDropResult({ round, outcome, medalStars, isLast, font, onNext, onReplay, onEasier, onMap }: Props) {
  const mapButton = (
    <button type="button" onClick={onMap} style={{ ...secondaryBtn(font), marginTop: 8 }}>
      回地圖
    </button>
  );
  if (outcome.kind === "won") {
    return (
      <GameEndStation
        mood="win"
        title={isLast ? "全部完成！" : "過關了！"}
        stars={outcome.stars}
        scoreLabel="這一局"
        gameSlug="block-drop"
        onReplay={onReplay}
        replayLabel="再挑戰"
        mainAction={isLast ? undefined : { label: "下一站", icon: "next", onClick: onNext }}
        details={<StarRules round={round} outcome={outcome} medalStars={medalStars} />}
        extraActions={mapButton}
        hideHubLink
      />
    );
  }
  if (outcome.kind === "wrapUp") {
    return (
      <GameEndStation
        mood="over"
        title={outcome.lines > 0 ? `已經消了 ${outcome.lines} 排！` : "休息一下，再來一次！"}
        gameSlug="block-drop"
        onReplay={onReplay}
        replayLabel="再試一次"
        extraActions={
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            {round.station.index > 0 ? (
              <button type="button" onClick={onEasier} style={{ ...secondaryBtn(font), marginTop: 8 }}>
                換簡單一點的盤
              </button>
            ) : null}
            {mapButton}
          </div>
        }
        hideHubLink
      />
    );
  }
  return (
    <GameEndStation
      mood="retry"
      title={outcome.reason === "outOfPieces" ? "方塊用完了，再試一次！" : "方塊到頂了，再試一次！"}
      gameSlug="block-drop"
      onReplay={onReplay}
      replayLabel="再挑戰"
      extraActions={mapButton}
      hideHubLink
    />
  );
}
