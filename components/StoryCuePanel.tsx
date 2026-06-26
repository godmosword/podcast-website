"use client";

import styles from "./StoryPlayer.module.css";

type StoryCuePanelProps = {
  color: string;
  cueNow: number;
  cueMarks: number[];
  captionCount: number;
  cueCopied: boolean;
  onMark: () => void;
  onUndo: () => void;
  onReset: () => void;
  onCopy: () => void;
};

/**
 * 字幕對時面板（僅 ?cue=1 開發工具用）。
 * 抽出成獨立元件並由 StoryPlayer 動態載入，正常播放不需載入這段 JS。
 */
export default function StoryCuePanel({
  color,
  cueNow,
  cueMarks,
  captionCount,
  cueCopied,
  onMark,
  onUndo,
  onReset,
  onCopy,
}: StoryCuePanelProps) {
  return (
    <div className={styles.cuePanel} role="region" aria-label="字幕對時模式">
      <div className={styles.cueHead}>
        <span className={styles.cueNow}>{cueNow.toFixed(1)}s</span>
        <span className={styles.cueCount}>
          已記 {cueMarks.length}/{captionCount} 句
        </span>
      </div>
      <button
        type="button"
        className={styles.cueMark}
        style={{ backgroundColor: color }}
        onClick={onMark}
      >
        ⏱ 記下這一句（第 {cueMarks.length + 1} 句）
      </button>
      <code className={styles.cueOut}>
        captionTimes: [{cueMarks.join(", ")}],
      </code>
      <div className={styles.cueBtns}>
        <button type="button" onClick={onUndo} disabled={cueMarks.length === 0}>
          復原
        </button>
        <button type="button" onClick={onReset} disabled={cueMarks.length === 0}>
          清除
        </button>
        <button type="button" onClick={onCopy} disabled={cueMarks.length === 0}>
          {cueCopied ? "已複製 ✓" : "複製"}
        </button>
      </div>
    </div>
  );
}
