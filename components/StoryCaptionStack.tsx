import type { CaptionSize } from "@/lib/progress-store";
import type { CaptionWindow } from "@/lib/subtitle-cue";
import styles from "./StoryPlayer.module.css";

type StoryCaptionStackProps = {
  window: CaptionWindow;
  size: CaptionSize;
  /** 句切換動畫 key（mode-index） */
  cueKey: string;
};

/** 只顯示當前一句，維持畫面聚焦的 liquid glass 字幕。 */
export default function StoryCaptionStack({
  window,
  size,
  cueKey,
}: StoryCaptionStackProps) {
  const { current } = window;
  if (!current) return null;

  return (
    <div className={styles.captionWrap} data-size={size}>
      <div className={styles.captionStack} aria-live="polite">
        <p
          key={cueKey}
          className={styles.captionCurrent}
          data-role="current"
        >
          {current}
        </p>
      </div>
    </div>
  );
}
