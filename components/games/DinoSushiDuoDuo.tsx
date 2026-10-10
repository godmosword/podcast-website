"use client";

import { PlateArt, SushiArt } from "@/lib/games/dino-sushi/art";
import { DuoDuoArt, ToothbrushArt, type DuoDuoFace, type DuoDuoMouth } from "@/lib/games/dino-sushi/duoduo-art";
import type { Reaction } from "@/lib/games/dino-sushi/reactions";
import type { Sushi } from "@/lib/games/dino-sushi/sushi";
import { TapButton } from "./DinoSushiPiece";
import type { ServePhase } from "./useDinoSushiPlay";
import styles from "./DinoSushiKitchen.module.css";

type Props = {
  phase: ServePhase;
  caption: Reaction | null;
  /** 正在吃的那一盤（送出到反應結束）。 */
  serving: Sushi | null;
  brushing: boolean;
  brushOffer: boolean;
  disabled: boolean;
  onBrush: () => void;
};

function pose(phase: ServePhase, caption: Reaction | null, brushing: boolean): { mouth: DuoDuoMouth; face: DuoDuoFace } {
  if (brushing) return { mouth: "open", face: "yum" };
  if (phase === "slide" || phase === "open") return { mouth: "open", face: "idle" };
  if (phase === "chew") return { mouth: "chew", face: "yum" };
  if (caption) return { mouth: caption.mood === "puff" ? "laugh" : "closed", face: caption.mood };
  return { mouth: "closed", face: "idle" };
}

/** 多多＋迴轉帶上滑過來的盤子＋字卡＋刷牙彩蛋。 */
export function DinoSushiDuoDuo({ phase, caption, serving, brushing, brushOffer, disabled, onBrush }: Props) {
  const { mouth, face } = pose(phase, caption, brushing);
  const plateOnBelt = serving && (phase === "slide" || phase === "open" || phase === "chew");
  return (
    <div className={styles.duo}>
      <span className={styles.duoArt} data-face={face} data-mouth={mouth}>
        <DuoDuoArt mouth={mouth} face={face} shinyTeeth={brushing} />
        {brushing ? <span className={styles.foam} aria-hidden /> : null}
      </span>

      {plateOnBelt ? (
        <span className={styles.servingPlate} data-phase={phase} aria-hidden>
          {phase === "chew" ? null : <SushiArt sushi={serving} />}
          <PlateArt />
        </span>
      ) : null}

      {caption ? (
        <p className={styles.caption} data-mood={caption.mood} aria-hidden>
          {caption.line}
        </p>
      ) : null}

      {/* 吃完才出牙刷，不擋嘴 */}
      {brushOffer && !brushing && (phase === "react" || phase === "idle") ? (
        <TapButton className={styles.brushButton} aria-label="幫多多刷牙" disabled={disabled} onTap={onBrush}>
          <ToothbrushArt />
        </TapButton>
      ) : null}
    </div>
  );
}
