"use client";

import { BRUSH_SIZES, type BrushSizeId, type ColoringTool } from "@/lib/coloring/tools";
import {
  BucketIcon,
  ClearIcon,
  CrayonIcon,
  DownloadIcon,
  EraserIcon,
  PreviewIcon,
  ResetViewIcon,
  UndoIcon,
} from "./ColoringToolbarIcons";
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

const TOOLS: {
  id: ColoringTool;
  label: string;
  Icon: typeof CrayonIcon;
}[] = [
  { id: "crayon", label: "蠟筆", Icon: CrayonIcon },
  { id: "bucket", label: "油漆桶", Icon: BucketIcon },
  { id: "eraser", label: "橡皮擦", Icon: EraserIcon },
];

function sizeDotPx(displayRadius: number) {
  return Math.min(22, Math.max(8, displayRadius * 1.15));
}

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
        <div className={styles.group} role="group" aria-label="畫具">
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.btn} ${tool === item.id ? styles.active : ""}`}
              aria-label={item.label}
              aria-pressed={tool === item.id}
              title={item.label}
              onClick={() => onToolChange(item.id)}
            >
              <item.Icon className={styles.icon} />
            </button>
          ))}
        </div>
        <div className={styles.group} role="group" aria-label="筆刷大小">
          {BRUSH_SIZES.map((size) => {
            const dot = sizeDotPx(size.displayRadius);
            return (
              <button
                key={size.id}
                type="button"
                className={`${styles.btn} ${brushSize === size.id ? styles.active : ""}`}
                aria-pressed={brushSize === size.id}
                aria-label={`筆刷${size.name}`}
                title={`筆刷${size.name}`}
                disabled={tool === "bucket"}
                onClick={() => onBrushSizeChange(size.id)}
              >
                <span
                  className={styles.sizeDot}
                  data-size-dot=""
                  style={{ width: dot, height: dot }}
                />
              </button>
            );
          })}
        </div>
        <div className={styles.group} role="group" aria-label="畫布操作">
          <button
            type="button"
            className={styles.btn}
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="復原"
            title="復原"
          >
            <UndoIcon className={styles.icon} />
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={onClear}
            aria-label="清空"
            title="清空"
          >
            <ClearIcon className={styles.icon} />
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={onResetView}
            disabled={!viewActive}
            aria-label="縮放還原"
            title="縮放還原"
          >
            <ResetViewIcon className={styles.icon} />
          </button>
          <button
            type="button"
            className={`${styles.btn} ${showPreview ? styles.active : ""}`}
            aria-label="看原圖"
            aria-pressed={showPreview}
            title="看原圖"
            onClick={onTogglePreview}
          >
            <PreviewIcon className={styles.icon} />
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            onClick={onDownload}
            aria-label="下載"
            title="下載"
          >
            <DownloadIcon className={styles.icon} />
          </button>
        </div>
      </div>
      <p id="coloring-toolbar-hint" className={styles.scrollHint}>
        手機可左右滑動查看更多工具 →
      </p>
    </div>
  );
}
