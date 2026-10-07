"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  BRUSH_SIZES,
  type BrushSizeId,
  type ColoringTool,
} from "@/lib/coloring/tools";
import {
  BucketIcon,
  ClearIcon,
  CrayonIcon,
  DownloadIcon,
  EraserIcon,
  ResetViewIcon,
  UndoIcon,
} from "./ColoringToolbarIcons";
import styles from "./ColoringToolbar.module.css";
type Props = {
  tool: ColoringTool;
  onToolChange: (t: ColoringTool) => void;
  brushSize: BrushSizeId;
  onBrushSizeChange: (s: BrushSizeId) => void;
  canUndo: boolean;
  onUndo: () => void;
  canRedo?: boolean;
  onRedo?: () => void;
  onClear: () => void;
  onDownload: () => void;
  viewActive: boolean;
  onResetView: () => void;
  cueTool?: ColoringTool | null;
  ready?: boolean;
  colorGroup?: "all" | "rainbow" | "forest";
  onColorGroupChange?: (g: "all" | "rainbow" | "forest") => void;
  guided?: boolean;
  onGuidedChange?: (v: boolean) => void;
  onPrint?: () => void;
};
const TOOLS = [
  { id: "crayon", label: "蠟筆", Icon: CrayonIcon },
  { id: "bucket", label: "填滿", Icon: BucketIcon },
  { id: "eraser", label: "擦掉", Icon: EraserIcon },
] as const;
export function ColoringToolbar(p: Props) {
  const [open, setOpen] = useState(false),
    [clearArmed, setClearArmed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panel);
  const close = () => {
    setOpen(false);
    setClearArmed(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!clearArmed) return;
    const t = setTimeout(() => setClearArmed(false), 2500);
    return () => clearTimeout(t);
  }, [clearArmed]);
  return (
    <div className={styles.wrap}>
      <div role="toolbar" aria-label="著色工具" className={styles.bar}>
        {TOOLS.map(({ id, label, Icon }) => (
          <button
            type="button"
            key={id}
            className={`${styles.toolBtn} ${p.tool === id ? styles.active : ""} ${p.cueTool === id ? styles.cue : ""}`}
            aria-pressed={p.tool === id}
            aria-label={label}
            disabled={p.ready === false}
            onClick={() => p.onToolChange(id)}
          >
            <Icon className={styles.icon} />
            <span>{label}</span>
          </button>
        ))}
        <button
          type="button"
          className={styles.toolBtn}
          disabled={!p.canUndo || p.ready === false}
          aria-label="復原"
          onClick={p.onUndo}
        >
          <UndoIcon className={styles.icon} />
          <span>復原</span>
        </button>
        <button
          ref={trigger}
          type="button"
          className={styles.toolBtn}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <span aria-hidden>•••</span>
          <span>更多</span>
        </button>
      </div>
      {open &&
        createPortal(
          <div
            className={styles.backdrop}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label="更多著色工具"
              className={styles.panel}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  close();
                }
              }}
            >
              <div className={styles.panelHeader}>
                <strong>更多著色工具</strong>
                <button type="button" onClick={close}>
                  關閉
                </button>
              </div>
              <div role="group" aria-label="筆刷大小" className={styles.group}>
                {BRUSH_SIZES.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    className={`${styles.btn} ${p.brushSize === size.id ? styles.active : ""}`}
                    aria-label={`筆刷${size.name}`}
                    aria-pressed={p.brushSize === size.id}
                    disabled={p.tool === "bucket" || p.ready === false}
                    onClick={() => p.onBrushSizeChange(size.id)}
                  >
                    <span
                      data-size-dot
                      className={styles.sizeDot}
                      style={{
                        width: Math.min(
                          22,
                          Math.max(8, size.displayRadius * 1.15),
                        ),
                        height: Math.min(
                          22,
                          Math.max(8, size.displayRadius * 1.15),
                        ),
                      }}
                    />
                  </button>
                ))}
              </div>
              <div role="group" aria-label="塗色模式" className={styles.group}>
                {[true, false].map((guided) => (
                  <button
                    key={String(guided)}
                    type="button"
                    className={styles.option}
                    aria-pressed={(p.guided !== false) === guided}
                    onClick={() => p.onGuidedChange?.(guided)}
                  >
                    {guided ? "安心塗 · 不出線" : "自由塗 · 畫花紋"}
                  </button>
                ))}
              </div>
              <div role="group" aria-label="色組" className={styles.group}>
                {(["all", "rainbow", "forest"] as const).map((g) => (
                  <button
                    type="button"
                    key={g}
                    aria-pressed={(p.colorGroup ?? "all") === g}
                    onClick={() => p.onColorGroupChange?.(g)}
                  >
                    {g === "all"
                      ? "全部顏色"
                      : g === "rainbow"
                        ? "彩虹色"
                        : "森林色"}
                  </button>
                ))}
              </div>
              <div className={styles.options}>
                <button
                  type="button"
                  disabled={!p.canRedo || p.ready === false}
                  onClick={p.onRedo}
                >
                  ↪ 重做
                </button>
                <button
                  type="button"
                  disabled={p.ready === false}
                  aria-label={clearArmed ? "再按一次清空" : "清空"}
                  onClick={() => {
                    if (clearArmed) {
                      p.onClear();
                      close();
                    } else setClearArmed(true);
                  }}
                >
                  <ClearIcon className={styles.icon} />
                  {clearArmed ? "再按一次清空" : "清空"}
                </button>
                <button
                  type="button"
                  disabled={!p.viewActive}
                  onClick={() => {
                    p.onResetView();
                    close();
                  }}
                  aria-label="縮放還原"
                >
                  <ResetViewIcon className={styles.icon} />
                  縮放還原
                </button>
                <button
                  type="button"
                  disabled={p.ready === false}
                  onClick={p.onDownload}
                  aria-label="下載"
                >
                  <DownloadIcon className={styles.icon} />
                  下載
                </button>
                {p.onPrint ? (
                  <button
                    type="button"
                    disabled={p.ready === false}
                    onClick={p.onPrint}
                  >
                    列印線稿
                  </button>
                ) : null}
              </div>
              <p className={styles.note}>
                清空後可以復原。作品只存在這台裝置。
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
