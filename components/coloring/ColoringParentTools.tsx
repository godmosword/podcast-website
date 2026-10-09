"use client";

import { useId, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import Icon from "@/components/ui/Icon";
import {
  BRUSH_SIZES,
  COLOR_GROUPS,
  paletteForGroup,
  type BrushSizeId,
  type ColorGroupId,
} from "@/lib/coloring/tools";
import {
  ClearIcon,
  DeviceIcon,
  DownloadIcon,
  FreeDrawIcon,
  InsideLinesIcon,
  PrintIcon,
  RedoIcon,
} from "./ColoringToolbarIcons";
import styles from "./ColoringParentTools.module.css";

type ColoringParentToolsProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  clearButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  ready: boolean;
  brushSize: BrushSizeId;
  brushDisabled: boolean;
  onBrushSizeChange: (s: BrushSizeId) => void;
  guided: boolean;
  onGuidedChange?: (v: boolean) => void;
  colorGroup: ColorGroupId;
  onColorGroupChange?: (g: ColorGroupId) => void;
  canRedo: boolean;
  onRedo?: () => void;
  onDownload: () => void;
  onPrint?: () => void;
  onAskClear: () => void;
};

const MODES = [
  { guided: true, name: "不出線", desc: "只塗在框框裡", Icon: InsideLinesIcon },
  { guided: false, name: "自由塗", desc: "可以畫花紋", Icon: FreeDrawIcon },
] as const;

/** 圓點大小只是示意：跟著三檔筆刷由小到大，最大不超出按鈕。 */
const dotPx = (displayRadius: number) =>
  Math.min(22, Math.max(8, displayRadius * 1.15));

/**
 * 家長工具（按住齒輪才開）：上面三塊設定各有標題，下面是 2×2 動作磚，清空放最後。
 * 縮放還原不在這裡：只在放大後浮在畫布上（ColoringResetView）。
 */
export function ColoringParentTools(p: ColoringParentToolsProps) {
  const id = useId();
  const titleId = `${id}-title`;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    p.onClose();
  };

  return (
    <div
      ref={p.panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={styles.panel}
      onKeyDown={onKeyDown}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          家長工具
        </h2>
        <button
          type="button"
          className={styles.close}
          aria-label="關閉"
          onClick={p.onClose}
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <Tile title="筆刷粗細">
        <div role="group" aria-label="筆刷粗細" className={styles.segment}>
          {BRUSH_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              aria-label={`筆刷${size.name}`}
              aria-pressed={p.brushSize === size.id}
              disabled={p.brushDisabled}
              onClick={() => p.onBrushSizeChange(size.id)}
            >
              <span
                data-size-dot
                className={styles.dot}
                style={{
                  width: dotPx(size.displayRadius),
                  height: dotPx(size.displayRadius),
                }}
              />
            </button>
          ))}
        </div>
      </Tile>

      <Tile title="塗法">
        <div role="group" aria-label="塗法" className={styles.choices2}>
          {MODES.map((mode) => (
            <button
              key={mode.name}
              type="button"
              className={styles.choice}
              aria-pressed={p.guided === mode.guided}
              onClick={() => p.onGuidedChange?.(mode.guided)}
            >
              <span className={styles.choiceIcon}>
                <mode.Icon />
              </span>
              <span className={styles.choiceText}>
                <span className={styles.choiceName}>{mode.name}</span>
                <span className={styles.choiceDesc}>{mode.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </Tile>

      <Tile title="色盤">
        <div role="group" aria-label="色盤" className={styles.choices3}>
          {COLOR_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              className={`${styles.choice} ${styles.groupChoice}`}
              aria-label={group.name}
              aria-pressed={p.colorGroup === group.id}
              onClick={() => p.onColorGroupChange?.(group.id)}
            >
              <span className={styles.swatches} aria-hidden="true">
                {paletteForGroup(group.id).map((swatch) => (
                  <span
                    key={swatch.id}
                    data-swatch
                    className={styles.swatch}
                    style={{ background: swatch.hex }}
                  />
                ))}
              </span>
              <span className={styles.choiceName}>{group.name}</span>
            </button>
          ))}
        </div>
      </Tile>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          disabled={!p.canRedo || !p.ready}
          onClick={p.onRedo}
        >
          <RedoIcon />
          重做
        </button>
        <button
          type="button"
          className={styles.action}
          disabled={!p.ready}
          onClick={p.onDownload}
        >
          <DownloadIcon />
          下載
        </button>
        {p.onPrint ? (
          <button
            type="button"
            className={styles.action}
            disabled={!p.ready}
            onClick={p.onPrint}
          >
            <PrintIcon />
            列印線稿
          </button>
        ) : null}
        <button
          ref={p.clearButtonRef}
          type="button"
          className={`${styles.action} ${styles.danger}`}
          disabled={!p.ready}
          onClick={p.onAskClear}
        >
          <ClearIcon />
          清空
        </button>
      </div>

      <p className={styles.note}>
        <DeviceIcon className={styles.noteIcon} />
        作品只存在這台裝置
      </p>
    </div>
  );
}

function Tile({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section className={styles.tile} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.caption}>
        {title}
      </h3>
      {children}
    </section>
  );
}
