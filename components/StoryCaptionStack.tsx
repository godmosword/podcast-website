import type { CaptionSize } from "@/lib/progress-store";
import type { CaptionWindow } from "@/lib/subtitle-cue";
import styles from "./StoryPlayer.module.css";

type StoryCaptionStackProps = {
  window: CaptionWindow;
  size: CaptionSize;
  /** 句切換動畫 key（mode-index） */
  cueKey: string;
};

/** D13：前／當前／後一句字幕堆疊（當前句 aria-live）。 */
export default function StoryCaptionStack({
  window,
  size,
  cueKey,
}: StoryCaptionStackProps) {
  const { prev, current, next } = window;
  if (!current) return null;

  return (
    <div className={styles.captionWrap} data-size={size}>
      <div className={styles.captionStack} aria-live="polite">
        {prev ? (
          <p className={styles.captionAdjacent} data-role="prev">
            {prev}
          </p>
        ) : (
          <span className={styles.captionSpacer} aria-hidden />
        )}
        <p
          key={cueKey}
          className={styles.captionCurrent}
          data-role="current"
        >
          {current}
        </p>
        {next ? (
          <p className={styles.captionAdjacent} data-role="next">
            {next}
          </p>
        ) : (
          <span className={styles.captionSpacer} aria-hidden />
        )}
      </div>
    </div>
  );
}
