"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useGamePlayChromeSlot } from "@/components/games/GamePlayChromeSlot";
import SfxToggle from "@/components/SfxToggle";
import Icon from "@/components/ui/Icon";
import {
  BRUSH_SIZES,
  type BrushSizeId,
  type ColoringTool,
} from "@/lib/coloring/tools";
import { ColoringPictureDialog } from "./ColoringPictureDialog";
import {
  BlankPageIcon,
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

/** 小孩短按不會打開；大人按住約 0.7 秒，或鍵盤 Enter／空白鍵。 */
const ADULT_HOLD_MS = 700;

export function ColoringToolbar(p: Props) {
  const [open, setOpen] = useState(false);
  const [clearAsked, setClearAsked] = useState(false);
  const [holding, setHolding] = useState(false);
  const hintId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const clearBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const returnToClear = useRef(false);
  const chromeSlot = useGamePlayChromeSlot();
  useFocusTrap(open && !clearAsked, panel);

  const clearHold = () => {
    setHolding(false);
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  useEffect(() => clearHold, []);

  useEffect(() => {
    if (clearAsked || !open || !returnToClear.current) return;
    returnToClear.current = false;
    clearBtn.current?.focus();
  }, [clearAsked, open]);

  const close = () => {
    setOpen(false);
    setClearAsked(false);
    trigger.current?.focus();
  };

  const gate = (
    <button
      ref={trigger}
      type="button"
      className={`${styles.adultGate} ${holding ? styles.holding : ""}`}
      aria-label="家長工具"
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-describedby={hintId}
      onPointerDown={() => {
        clearHold();
        setHolding(true);
        holdTimer.current = window.setTimeout(() => {
          holdTimer.current = null;
          suppressClick.current = true;
          setOpen(true);
        }, ADULT_HOLD_MS);
      }}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onPointerLeave={clearHold}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setOpen(true);
      }}
    >
      <Icon name="settings" size={24} />
      <svg className={styles.holdRing} viewBox="0 0 48 48" aria-hidden focusable="false">
        <circle cx="24" cy="24" r="20" />
      </svg>
      <span id={hintId} className={styles.srOnly}>
        按住才會打開
      </span>
    </button>
  );

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
            <span data-sr="">{label}</span>
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
          <span data-sr="">復原</span>
        </button>
        <SfxToggle className={styles.toolBtn} hideTitle />
      </div>
      {chromeSlot ? createPortal(gate, chromeSlot) : gate}
      {clearAsked
        ? createPortal(
            <ColoringPictureDialog
              label="要把顏色清掉嗎"
              actions={[
                {
                  label: "先不要清空",
                  tone: "stay",
                  icon: <CrayonIcon />,
                  onClick: () => {
                    returnToClear.current = true;
                    setClearAsked(false);
                  },
                },
                {
                  label: "清空畫布",
                  tone: "danger",
                  icon: <BlankPageIcon />,
                  onClick: () => {
                    p.onClear();
                    setClearAsked(false);
                    close();
                  },
                },
              ]}
            />,
            document.body,
          )
        : null}
      {open && !clearAsked
        ? createPortal(
            <div
              className={styles.backdrop}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
              <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-label="更多著色工具"
                className={styles.panel}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.stopPropagation();
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
                          width: Math.min(22, Math.max(8, size.displayRadius * 1.15)),
                          height: Math.min(22, Math.max(8, size.displayRadius * 1.15)),
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
                      {g === "all" ? "全部顏色" : g === "rainbow" ? "彩虹色" : "森林色"}
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
                    ref={clearBtn}
                    type="button"
                    disabled={p.ready === false}
                    aria-label="清空"
                    onClick={() => setClearAsked(true)}
                  >
                    <ClearIcon className={styles.icon} />
                    清空
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
                    <button type="button" disabled={p.ready === false} onClick={p.onPrint}>
                      列印線稿
                    </button>
                  ) : null}
                </div>
                <p className={styles.note}>清空後可以按復原。作品只存在這台裝置。</p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
