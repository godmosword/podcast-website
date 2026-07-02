import type { CSSProperties } from "react";
import type { ThemePreference } from "@/lib/theme";
import { mapDepthZ } from "@/lib/universe-depth";
import styles from "./NightFireworks.module.css";

/**
 * 夜間樂園煙火（R-joy 3）：主島上空低頻綻放的光效粒子。
 * 煙火是「光」不是黏土物件，與 openGlow／螢火同屬 CSS 光效範疇，
 * 不違反 Art Bible v5 的黏土素材鐵律；黏土煙火 sprite（§12.2）留待資產輪。
 */

/** 三發交錯，約每 2.5s 一發；色票取園區點綴色（點綴件可飽和）。 */
const BURSTS = [
  { id: "fw-a", x: 430, y: 168, r: 42, color: "#ffd866", delayMs: 0 },
  { id: "fw-b", x: 566, y: 138, r: 36, color: "#f7a8c4", delayMs: 2500 },
  { id: "fw-c", x: 500, y: 102, r: 46, color: "#8fcde8", delayMs: 5000 },
] as const;

const PERIOD_MS = 7500;
const DIRS = 8;

/** 深度：depthY 300 < car-park 錨點 400 → 落在主島後方，煙火從摩天輪背後綻放。 */
const FIREWORK_DEPTH_Y = 300;

type Props = {
  daylight: ThemePreference;
  reduced: boolean;
  paused: boolean;
};

export default function NightFireworks({ daylight, reduced, paused }: Props) {
  // 純移動型光效：日間不渲染；reduced-motion 無靜止英雄姿可停，直接不渲染。
  if (daylight !== "night" || reduced) return null;

  return (
    <div
      className={[styles.layer, paused ? styles.paused : ""].filter(Boolean).join(" ")}
      style={{ zIndex: mapDepthZ(FIREWORK_DEPTH_Y, "island") }}
      aria-hidden="true"
    >
      {BURSTS.map((burst) => (
        <span
          key={burst.id}
          className={styles.burst}
          style={{ left: burst.x, top: burst.y }}
        >
          {Array.from({ length: DIRS }, (_, i) => {
            const angle = (i / DIRS) * Math.PI * 2;
            return (
              <span
                key={i}
                className={styles.particle}
                style={
                  {
                    "--c": burst.color,
                    "--fx": `${Math.cos(angle) * burst.r}px`,
                    "--fy": `${Math.sin(angle) * burst.r}px`,
                    "--period": `${PERIOD_MS}ms`,
                    "--delay": `${burst.delayMs}ms`,
                  } as CSSProperties
                }
              />
            );
          })}
        </span>
      ))}
    </div>
  );
}
