"use client";

import { DoorIcon, LightStopIcon, StopIcon } from "@/components/games/OrangeExpressCab";
import { EventGlyph } from "@/components/games/OrangeExpressEventGlyphs";
import { GOAL_TEXT } from "@/lib/games/orange-express/copy";
import type { RunGoal } from "@/lib/games/orange-express/journal";
import styles from "./orange-express.module.css";

/** 小目標的圖示：跟駕駛台、結算同一個符號（綠色區配站卡的綠條紋色塊、開過頭配停車燈、門配車門、輕輕停配「輕」）。 */
function GoalMark({ goal }: { goal: RunGoal }) {
  if (goal === "green") return <span className={styles.goalSwatch} data-grade="green" />;
  if (goal === "overrun") return <StopIcon size={18} />;
  if (goal === "early-door") return <DoorIcon size={18} />;
  if (goal === "smooth") return <LightStopIcon />;
  return <EventGlyph kind={goal} scene={goal === "race" ? "city" : "field"} />;
}

/**
 * 下趟小目標（PR-I3）：結算「下次試試：…」、任務卡「這次試試：…」。一個圖示＋一句，不是星星（不畫 +★）。
 */
export function OrangeExpressGoal({ goal, prefix, testId }: { goal: RunGoal; prefix: string; testId: string }) {
  return (
    <p className={styles.goal} data-goal={goal} data-testid={testId}>
      <span className={styles.goalMark} aria-hidden>
        <GoalMark goal={goal} />
      </span>
      {prefix}
      {GOAL_TEXT[goal]}
    </p>
  );
}
