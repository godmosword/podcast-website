"use client";

import type { CSSProperties, ReactNode } from "react";

export type GameResultActionsProps = {
  onReplay: () => void;
  replayLabel: ReactNode;
  replayStyle?: CSSProperties;
  replayClassName?: string;
  /** 額外的遊戲操作按鈕。 */
  extraActions?: ReactNode;
  className?: string;
};

/** 統一結算操作插槽。 */
export function GameResultActions({
  onReplay,
  replayLabel,
  replayStyle,
  replayClassName,
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
      {extraActions}
    </div>
  );
}
