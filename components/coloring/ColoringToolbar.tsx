"use client";

import { BRUSH_SIZES, type BrushSizeId, type ColoringTool } from "@/lib/coloring/tools";
import styles from "./ColoringToolbar.module.css";

type ColoringToolbarProps = {
  tool: ColoringTool;
  onToolChange: (tool: ColoringTool) => void;
  brushSize: BrushSizeId;
  onBrushSizeChange: (size: BrushSizeId) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  onDownload: () => void;
  viewActive: boolean;
  onResetView: () => void;
};

const TOOLS: { id: ColoringTool; label: string }[] = [
  { id: "crayon", label: "蠟筆" },
  { id: "bucket", label: "油漆桶" },
  { id: "eraser", label: "橡皮擦" },
];

export function ColoringToolbar({
  tool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  showPreview,
  onTogglePreview,
  canUndo,
  onUndo,
  onClear,
  onDownload,
  viewActive,
  onResetView,
}: ColoringToolbarProps) {
  return (
    <div className={styles.wrap}>
      <div
        className={styles.bar}
        role="toolbar"
        aria-label="著色工具"
        aria-describedby="coloring-toolbar-hint"
      >
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
        <div className={styles.group} role="group" aria-label="筆刷大小">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              className={`${styles.btn} ${brushSize === size.id ? styles.active : ""}`}
              aria-pressed={brushSize === size.id}
              aria-label={`筆刷${size.name}`}
              disabled={tool === "bucket"}
              onClick={() => onBrushSizeChange(size.id)}
            >
              {size.name}
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
            className={styles.btn}
            onClick={onResetView}
            disabled={!viewActive}
          >
            縮放還原
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
      <p id="coloring-toolbar-hint" className={styles.scrollHint}>
        手機可左右滑動查看更多工具 →
      </p>
    </div>
  );
}
