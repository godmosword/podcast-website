"use client";

import type { ColoringTool } from "@/lib/coloring/tools";
import styles from "./ColoringToolbar.module.css";

type ColoringToolbarProps = {
  tool: ColoringTool;
  onToolChange: (tool: ColoringTool) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  onDownload: () => void;
};

const TOOLS: { id: ColoringTool; label: string }[] = [
  { id: "crayon", label: "蠟筆" },
  { id: "bucket", label: "油漆桶" },
  { id: "eraser", label: "橡皮擦" },
];

export function ColoringToolbar({
  tool,
  onToolChange,
  showPreview,
  onTogglePreview,
  canUndo,
  onUndo,
  onClear,
  onDownload,
}: ColoringToolbarProps) {
  return (
    <div className={styles.bar} role="toolbar" aria-label="著色工具">
      <div className={styles.group}>
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.btn} ${tool === item.id ? styles.active : ""}`}
            aria-pressed={tool === item.id}
            onClick={() => onToolChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles.group}>
        <button type="button" className={styles.btn} onClick={onUndo} disabled={!canUndo}>
          復原
        </button>
        <button type="button" className={styles.btn} onClick={onClear}>
          清空
        </button>
        <button
          type="button"
          className={`${styles.btn} ${showPreview ? styles.active : ""}`}
          aria-pressed={showPreview}
          onClick={onTogglePreview}
        >
          看原圖
        </button>
        <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onDownload}>
          下載
        </button>
      </div>
    </div>
  );
}
