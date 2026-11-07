"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { AdultHoldGate } from "@/components/games/AdultHoldGate";
import { useGamePlayChromeSlot } from "@/components/games/GamePlayChromeSlot";
import SfxToggle from "@/components/SfxToggle";
import type {
  BrushSizeId,
  ColorGroupId,
  ColoringTool,
} from "@/lib/coloring/tools";
import { ColoringParentTools } from "./ColoringParentTools";
import { ColoringPictureDialog } from "./ColoringPictureDialog";
import {
  BlankPageIcon,
  BucketIcon,
  CrayonIcon,
  EraserIcon,
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
  cueTool?: ColoringTool | null;
  ready?: boolean;
  colorGroup?: ColorGroupId;
  onColorGroupChange?: (g: ColorGroupId) => void;
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
  const [open, setOpen] = useState(false);
  const [clearAsked, setClearAsked] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const clearBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const returnToClear = useRef(false);
  const chromeSlot = useGamePlayChromeSlot();
  useFocusTrap(open && !clearAsked, panel);

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
    <AdultHoldGate className={styles.adultGate} open={open} onOpen={() => setOpen(true)} triggerRef={trigger} />
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
              <ColoringParentTools
                panelRef={panel}
                clearButtonRef={clearBtn}
                onClose={close}
                ready={p.ready !== false}
                brushSize={p.brushSize}
                brushDisabled={p.tool === "bucket" || p.ready === false}
                onBrushSizeChange={p.onBrushSizeChange}
                guided={p.guided !== false}
                onGuidedChange={p.onGuidedChange}
                colorGroup={p.colorGroup ?? "all"}
                onColorGroupChange={p.onColorGroupChange}
                canRedo={p.canRedo === true}
                onRedo={p.onRedo}
                onDownload={p.onDownload}
                onPrint={p.onPrint}
                onAskClear={() => setClearAsked(true)}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
