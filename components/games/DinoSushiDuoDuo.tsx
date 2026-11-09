"use client";

import { PlateArt, SushiArt } from "@/lib/games/dino-sushi/art";
import {
  DuoDuoSticker,
  ToothbrushSticker,
  type DuoDuoFace,
  type DuoDuoMouth,
} from "@/lib/games/dino-sushi/duoduo-sticker";
import type { Reaction } from "@/lib/games/dino-sushi/reactions";
import type { Mode } from "@/lib/games/dino-sushi/round";
import type { Sushi } from "@/lib/games/dino-sushi/sushi";
import { TapButton } from "./DinoSushiPiece";
import type { ServePhase } from "./useDinoSushiPlay";
import styles from "./DinoSushiKitchen.module.css";

type Props = {
  /** 點餐：多多是店長，壽司送給客人；自由做：多多自己吃。 */
  mode: Mode;
  phase: ServePhase;
  caption: Reaction | null;
  /** 自由做時正在吃的那一盤（送出到反應結束）；點餐的盤子由客人座位那邊畫。 */
  serving: Sushi | null;
  brushing: boolean;
  /** 牙刷鈕現在要不要出現（廚房算好，店面道具同時讓位）。 */
  brushShown: boolean;
  disabled: boolean;
  onBrush: () => void;
};

type DuoPose = { mouth: DuoDuoMouth; face: DuoDuoFace; cheer: boolean };

/**
 * 多多的表情。點餐時多多是店長：送過去、朋友咬的時候在旁邊看；朋友吃到那一拍微笑、小跳（cheer），
 * 不用愛心眼、不大笑——最開心的要是朋友（2026-11-08 設計審 MUST-1）。自由做才是多多自己吃。
 */
export function duoPose(mode: Mode, phase: ServePhase, caption: Reaction | null, brushing: boolean): DuoPose {
  if (brushing) return { mouth: "open", face: "yum", cheer: false };
  if (mode === "order") {
    if (phase === "handoff" || phase === "ride" || phase === "eat") return { mouth: "closed", face: "look", cheer: false };
    if (caption?.eats) return { mouth: "closed", face: "idle", cheer: true };
    if (caption) return { mouth: "closed", face: caption.mood, cheer: false };
    return { mouth: "closed", face: "idle", cheer: false };
  }
  if (phase === "ride" || phase === "eat") return { mouth: "open", face: "idle", cheer: false };
  if (phase === "chew") return { mouth: "chew", face: "yum", cheer: false };
  /* puff 仍傳出去：貼紙層把芥末畫成噴火，並用 data-face 晃一下。 */
  if (caption) return { mouth: caption.mood === "puff" ? "laugh" : "closed", face: caption.mood, cheer: false };
  return { mouth: "closed", face: "idle", cheer: false };
}

export function DinoSushiDuoDuo({ mode, phase, caption, serving, brushing, brushShown, disabled, onBrush }: Props) {
  const { mouth, face, cheer } = duoPose(mode, phase, caption, brushing);
  const plateOnBelt = mode === "free" && serving && (phase === "ride" || phase === "eat" || phase === "chew");
  return (
    <div className={styles.duo}>
      <span className={styles.duoArt} data-face={face} data-mouth={mouth} data-cheer={cheer ? "true" : undefined}>
        <DuoDuoSticker mouth={mouth} face={face} />
        {brushing ? <span className={styles.foam} aria-hidden /> : null}
      </span>

      {plateOnBelt ? (
        <span className={styles.servingPlate} data-phase={phase} aria-hidden>
          {/* 張嘴時這一口從盤上飛進嘴裡（CSS sushiBite）；嚼的時候盤上已經空了 */}
          {phase === "chew" ? null : (
            <span className={styles.servingSushi} data-phase={phase}>
              <SushiArt sushi={serving} />
            </span>
          )}
          <PlateArt />
        </span>
      ) : null}

      {brushShown ? (
        <TapButton className={styles.brushButton} aria-label="幫多多刷牙" disabled={disabled} onTap={onBrush}>
          <ToothbrushSticker />
        </TapButton>
      ) : null}
    </div>
  );
}
