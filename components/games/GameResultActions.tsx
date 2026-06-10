"use client";

import type { CSSProperties, ReactNode } from "react";
import { FEATURES } from "@/lib/features";

export type GameResultActionsProps = {
  onReplay: () => void;
  replayLabel: string;
  replayStyle?: CSSProperties;
  replayClassName?: string;
  onGoodnight?: () => void;
  goodnightLabel?: string;
  goodnightStyle?: CSSProperties;
  goodnightClassName?: string;
  /** 額外按鈕（例如海盜卡丁車「回主選單」） */
  extraActions?: ReactNode;
  className?: string;
};

/**
 * 統一結算操作插槽。`FEATURES.goodnightButton` 預設關閉，不影響現有 UI。
 */
export function GameResultActions({
  onReplay,
  replayLabel,
  replayStyle,
  replayClassName,
  onGoodnight,
  goodnightLabel = "晚安 🌙",
  goodnightStyle,
  goodnightClassName,
  extraActions,
  className,
}: GameResultActionsProps) {
  return (
    <div className={className} style={{ display: "contents" }}>
      <button
        type="button"
        onClick={onReplay}
        style={replayStyle}
        className={replayClassName}
      >
        {replayLabel}
      </button>
      {FEATURES.goodnightButton && onGoodnight ? (
        <button
          type="button"
          onClick={onGoodnight}
          style={goodnightStyle}
          className={goodnightClassName}
        >
          {goodnightLabel}
        </button>
      ) : null}
      {extraActions}
    </div>
  );
}
