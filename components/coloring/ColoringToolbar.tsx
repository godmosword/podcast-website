"use client";

import { useEffect, useState } from "react";
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
  /** 下一步要點的畫具；給那顆鈕一圈提示。 */
  cueTool?: ColoringTool | null;
};

const TOOLS: {
  id: ColoringTool;
  label: string;
  Icon: typeof CrayonIcon;
}[] = [
  { id: "crayon", label: "蠟筆", Icon: CrayonIcon },
  { id: "bucket", label: "填滿", Icon: BucketIcon },
  { id: "eraser", label: "擦掉", Icon: EraserIcon },
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
  cueTool = null,
}: ColoringToolbarProps) {
  const [clearArmed, setClearArmed] = useState(false);

  useEffect(() => {
    if (!clearArmed) return;
    const timer = setTimeout(() => setClearArmed(false), 2500);
    return () => clearTimeout(timer);
  }, [clearArmed]);

  const requestClear = () => {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }
    setClearArmed(false);
    onClear();
  };

  return (
    <div className={styles.wrap}>
      <div
        className={styles.bar}
        role="toolbar"
        aria-label="著色工具"
        aria-describedby="coloring-toolbar-hint"
      >
        <div className={styles.primary} role="group" aria-label="畫具">
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.toolBtn} ${tool === item.id ? styles.active : ""} ${
                cueTool === item.id ? styles.cue : ""
              }`}
              aria-label={item.label}
              aria-pressed={tool === item.id}
              title={item.label}
              onClick={() => {
                setClearArmed(false);
                onToolChange(item.id);
              }}
            >
              <item.Icon className={styles.icon} />
              <span className={styles.toolLabel}>{item.label}</span>
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
            className={`${styles.btn} ${clearArmed ? styles.armed : ""}`}
            onClick={requestClear}
            aria-label={clearArmed ? "再按一次清空" : "清空"}
            title={clearArmed ? "再按一次清空" : "清空"}
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
            aria-label="故事照片"
            aria-pressed={showPreview}
            title="故事照片"
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
        → 右邊可以調筆、清空、存圖
      </p>
    </div>
  );
}
